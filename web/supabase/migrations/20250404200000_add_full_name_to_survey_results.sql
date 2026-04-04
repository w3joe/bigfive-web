-- Add participant full name (run if you already applied 20250404000000_init without this column)
alter table public.survey_results
add column if not exists full_name text not null default '';
