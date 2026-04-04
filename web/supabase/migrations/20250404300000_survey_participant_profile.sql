-- Extended participant profile (collected before the personality items)
alter table public.survey_results
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists age integer,
  add column if not exists sex text,
  add column if not exists marital_status text,
  add column if not exists occupation text,
  add column if not exists education_level text,
  add column if not exists ethnic_background text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists skills_and_expertise_list jsonb,
  add column if not exists hobbies_and_interests_list jsonb;
