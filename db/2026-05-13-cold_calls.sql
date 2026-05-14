-- Run this in the Supabase SQL editor (project: LSG Hub).
create table if not exists public.cold_calls (
  id          uuid primary key default gen_random_uuid(),
  lead_name   text not null default '',
  caller      text check (caller in ('Arsh','Ammar')),
  notes       text not null default '',
  outcome     text check (outcome in ('Connected','Voicemail','No Answer','Follow-up','Not Interested','Booked')),
  created_at  timestamptz not null default now()
);

create index if not exists cold_calls_created_at_idx on public.cold_calls (created_at desc);

alter table public.cold_calls enable row level security;

-- Mirror the access pattern used by the other app tables (authenticated = full access).
drop policy if exists "cold_calls authenticated full access" on public.cold_calls;
create policy "cold_calls authenticated full access" on public.cold_calls
  for all to authenticated using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.cold_calls;
