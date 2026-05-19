-- Add the contact + scope columns that the estimator form collects
-- but were dropped from the save record in commit b1b348c ("columns may not exist").
-- Run in Supabase SQL Editor.

ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS org   TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS type  TEXT;
