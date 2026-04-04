-- Survey submissions (replaces MongoDB "results" collection)
create table public.survey_results (
  id uuid primary key default gen_random_uuid (),
  test_id text not null,
  lang text not null,
  full_name text not null default '',
  first_name text,
  middle_name text,
  last_name text,
  age integer,
  sex text,
  marital_status text,
  occupation text,
  education_level text,
  ethnic_background text,
  city text,
  country text,
  skills_and_expertise_list jsonb,
  hobbies_and_interests_list jsonb,
  invalid boolean not null default false,
  time_elapsed integer not null,
  date_stamp timestamptz not null,
  answers jsonb not null
);

create index survey_results_date_stamp_idx on public.survey_results (date_stamp desc);

-- Contact form (replaces MongoDB "feedback" collection)
create table public.feedback (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.survey_results enable row level security;

alter table public.feedback enable row level security;

-- Inserts/reads use the Supabase service role from server actions (RLS bypass).
-- If you later add client-side Supabase with the anon key, add explicit policies here.
