-- FIX: "Could not find the 'name' column of 'contacts' in the schema cache"
--
-- The `contacts` table in Supabase was created with first_name / last_name /
-- job_title columns, but the app uses a single `name` plus `role`. Since the
-- table is empty (0 rows), the cleanest fix is to recreate it with the schema
-- the app expects. Run this once in the Supabase SQL editor.

drop table if exists public.contacts cascade;

create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  role        text,
  email       text,
  phone       text,
  source      text,
  tags        jsonb not null default '[]'::jsonb,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.contacts enable row level security;

drop policy if exists "contacts authenticated full access" on public.contacts;
create policy "contacts authenticated full access" on public.contacts
  for all to authenticated using (true) with check (true);

-- Realtime (the table was just dropped, so it's been removed from the publication)
alter publication supabase_realtime add table public.contacts;

-- Refresh PostgREST's schema cache immediately
notify pgrst, 'reload schema';
