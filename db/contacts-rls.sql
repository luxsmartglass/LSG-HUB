-- Run this in Supabase → SQL Editor if "+ New Contact" fails with
-- "new row violates row-level security policy"

create policy "Authenticated users can manage contacts"
  on contacts
  for all
  to authenticated
  using (true)
  with check (true);
