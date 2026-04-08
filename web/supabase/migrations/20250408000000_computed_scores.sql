-- Add computed Big Five score columns.
-- These are auto-populated by the trigger below; never write them directly.
-- All *_score columns are percentages (0–100), rounded to the nearest integer.

ALTER TABLE public.survey_results
  ADD COLUMN IF NOT EXISTS n_score   smallint,   -- Neuroticism        0-100
  ADD COLUMN IF NOT EXISTS e_score   smallint,   -- Extraversion       0-100
  ADD COLUMN IF NOT EXISTS o_score   smallint,   -- Openness           0-100
  ADD COLUMN IF NOT EXISTS a_score   smallint,   -- Agreeableness      0-100
  ADD COLUMN IF NOT EXISTS c_score   smallint,   -- Conscientiousness  0-100
  ADD COLUMN IF NOT EXISTS n_result  text,       -- 'high'|'neutral'|'low'
  ADD COLUMN IF NOT EXISTS e_result  text,
  ADD COLUMN IF NOT EXISTS o_result  text,
  ADD COLUMN IF NOT EXISTS a_result  text,
  ADD COLUMN IF NOT EXISTS c_result  text,
  -- Per-facet breakdown with named traits, shape:
  -- {
  --   "N": { "Anxiety": { "score": 50, "result": "neutral" }, "Anger": {...}, ... },
  --   "E": { "Friendliness": {...}, ... },
  --   ...
  -- }
  ADD COLUMN IF NOT EXISTS facet_scores jsonb;

-- Indexes for common analytics queries
CREATE INDEX IF NOT EXISTS survey_results_n_result_idx ON public.survey_results (n_result);
CREATE INDEX IF NOT EXISTS survey_results_e_result_idx ON public.survey_results (e_result);
CREATE INDEX IF NOT EXISTS survey_results_o_result_idx ON public.survey_results (o_result);
CREATE INDEX IF NOT EXISTS survey_results_a_result_idx ON public.survey_results (a_result);
CREATE INDEX IF NOT EXISTS survey_results_c_result_idx ON public.survey_results (c_result);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: map facet number → trait name for each domain.
-- Keys match the IPIP-NEO-120 facet numbering in @bigfive-org/results (en).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bigfive_facet_name(domain text, facet_num text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT CASE domain
    WHEN 'N' THEN CASE facet_num
      WHEN '1' THEN 'Anxiety'
      WHEN '2' THEN 'Anger'
      WHEN '3' THEN 'Depression'
      WHEN '4' THEN 'Self-Consciousness'
      WHEN '5' THEN 'Immoderation'
      WHEN '6' THEN 'Vulnerability'
    END
    WHEN 'E' THEN CASE facet_num
      WHEN '1' THEN 'Friendliness'
      WHEN '2' THEN 'Gregariousness'
      WHEN '3' THEN 'Assertiveness'
      WHEN '4' THEN 'Activity Level'
      WHEN '5' THEN 'Excitement-Seeking'
      WHEN '6' THEN 'Cheerfulness'
    END
    WHEN 'O' THEN CASE facet_num
      WHEN '1' THEN 'Imagination'
      WHEN '2' THEN 'Artistic Interests'
      WHEN '3' THEN 'Emotionality'
      WHEN '4' THEN 'Adventurousness'
      WHEN '5' THEN 'Intellect'
      WHEN '6' THEN 'Liberalism'
    END
    WHEN 'A' THEN CASE facet_num
      WHEN '1' THEN 'Trust'
      WHEN '2' THEN 'Morality'
      WHEN '3' THEN 'Altruism'
      WHEN '4' THEN 'Cooperation'
      WHEN '5' THEN 'Modesty'
      WHEN '6' THEN 'Sympathy'
    END
    WHEN 'C' THEN CASE facet_num
      WHEN '1' THEN 'Self-Efficacy'
      WHEN '2' THEN 'Orderliness'
      WHEN '3' THEN 'Dutifulness'
      WHEN '4' THEN 'Achievement-Striving'
      WHEN '5' THEN 'Self-Discipline'
      WHEN '6' THEN 'Cautiousness'
    END
  END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger function: compute scores from answers.
-- Score formula : round((raw_sum / (count * 5)) * 100)  →  0–100 percentage
-- Result thresholds match packages/score/src/index.ts:
--   avg > 3.5 (= pct > 70) → 'high' | avg < 2.5 (= pct < 50) → 'low'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_bigfive_scores()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_all jsonb;
BEGIN
  WITH
  -- Flatten answers array → one row per (domain, facet)
  agg AS (
    SELECT
      a.domain,
      a.facet::text                     AS facet_num,
      sum(a.score)                      AS raw_sum,
      count(*)                          AS cnt,
      round((sum(a.score)::numeric / (count(*) * 5)) * 100) AS pct
    FROM jsonb_to_recordset(NEW.answers)
         AS a(domain text, facet int, score int)
    GROUP BY a.domain, a.facet
  ),
  -- Roll up to domain level
  domain_agg AS (
    SELECT
      domain,
      sum(raw_sum)                      AS raw_sum,
      sum(cnt)                          AS cnt,
      round((sum(raw_sum)::numeric / (sum(cnt) * 5)) * 100) AS pct
    FROM agg
    GROUP BY domain
  ),
  -- Build per-facet JSONB with named trait keys
  facet_json AS (
    SELECT
      domain,
      jsonb_object_agg(
        public.bigfive_facet_name(domain, facet_num),
        jsonb_build_object(
          'score',  pct,
          'result', CASE
            WHEN pct > 70 THEN 'high'
            WHEN pct < 50 THEN 'low'
            ELSE 'neutral'
          END
        )
      ) AS facets
    FROM agg
    GROUP BY domain
  )
  -- Combine everything into one JSONB keyed by domain letter
  SELECT jsonb_object_agg(
    d.domain,
    jsonb_build_object(
      'score',  d.pct,
      'result', CASE
        WHEN d.pct > 70 THEN 'high'
        WHEN d.pct < 50 THEN 'low'
        ELSE 'neutral'
      END,
      'facets', f.facets
    )
  )
  INTO v_all
  FROM domain_agg d
  JOIN facet_json f ON f.domain = d.domain;

  -- Domain percentages
  NEW.n_score  := (v_all -> 'N' ->> 'score')::smallint;
  NEW.e_score  := (v_all -> 'E' ->> 'score')::smallint;
  NEW.o_score  := (v_all -> 'O' ->> 'score')::smallint;
  NEW.a_score  := (v_all -> 'A' ->> 'score')::smallint;
  NEW.c_score  := (v_all -> 'C' ->> 'score')::smallint;

  -- Domain results
  NEW.n_result := v_all -> 'N' ->> 'result';
  NEW.e_result := v_all -> 'E' ->> 'result';
  NEW.o_result := v_all -> 'O' ->> 'result';
  NEW.a_result := v_all -> 'A' ->> 'result';
  NEW.c_result := v_all -> 'C' ->> 'result';

  -- Full named-facet breakdown
  NEW.facet_scores := jsonb_build_object(
    'N', v_all -> 'N' -> 'facets',
    'E', v_all -> 'E' -> 'facets',
    'O', v_all -> 'O' -> 'facets',
    'A', v_all -> 'A' -> 'facets',
    'C', v_all -> 'C' -> 'facets'
  );

  RETURN NEW;
END;
$$;

-- Attach trigger: fires before every INSERT or answers UPDATE
DROP TRIGGER IF EXISTS trg_compute_bigfive_scores ON public.survey_results;
CREATE TRIGGER trg_compute_bigfive_scores
  BEFORE INSERT OR UPDATE OF answers
  ON public.survey_results
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_bigfive_scores();

-- Backfill all existing rows
UPDATE public.survey_results
SET answers = answers;
