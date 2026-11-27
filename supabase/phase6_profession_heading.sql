-- =============================================================================
-- Phase 6 fixes
--   Add a customisable label for the dashboard "Your profession" dropdown
--   (the small uppercase heading above "Select your profession").
-- Safe to run multiple times (idempotent).
-- =============================================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS profession_heading text NOT NULL DEFAULT 'Your profession';

-- Verification (optional)
-- SELECT profession_heading FROM public.app_settings WHERE id = 1;
