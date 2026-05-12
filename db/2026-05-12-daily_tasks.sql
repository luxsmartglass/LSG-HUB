-- Run this in the Supabase SQL editor (project: LSG Hub).
create table if not exists public.daily_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  urgency      text not null default 'medium' check (urgency in ('low','medium','high')),
  due_date     date not null default current_date,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists daily_tasks_open_idx on public.daily_tasks (completed, due_date);

alter table public.daily_tasks enable row level security;

-- Mirror the access pattern used by the other app tables (authenticated = full access).
drop policy if exists "daily_tasks authenticated full access" on public.daily_tasks;
create policy "daily_tasks authenticated full access" on public.daily_tasks
  for all to authenticated using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.daily_tasks;
