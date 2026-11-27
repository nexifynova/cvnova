-- =============================================================================
-- Phase 7 — Admin controls for the landing page "Golden Circle" badge
--   golden_circle_movement : 0-100, how much of the curved sweep is played.
--                            0   = the badge parks on the banner (no movement)
--                            100 = full sweep from the top-right and back
--   golden_circle_effect   : sparkle / shine animation
--                            'none' | 'glow' | 'star' | 'pulse'
-- Safe to run multiple times (idempotent).
-- =============================================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS golden_circle_movement integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS golden_circle_effect   text    NOT NULL DEFAULT 'glow';

-- Keep the values inside the range the admin UI allows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_golden_circle_movement_check'
  ) THEN
    ALTER TABLE public.app_settings
      ADD CONSTRAINT app_settings_golden_circle_movement_check
      CHECK (golden_circle_movement >= 0 AND golden_circle_movement <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_golden_circle_effect_check'
  ) THEN
    ALTER TABLE public.app_settings
      ADD CONSTRAINT app_settings_golden_circle_effect_check
      CHECK (golden_circle_effect IN ('none', 'glow', 'star', 'pulse'));
  END IF;
END $$;

-- Verification (optional)
-- SELECT golden_circle_enabled, golden_circle_movement, golden_circle_effect
--   FROM public.app_settings WHERE id = 1;
