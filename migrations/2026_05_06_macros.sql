-- Add per-serving macro columns to meals (generated 2026-05-06)
-- Run this BEFORE the backfill script. All columns nullable so existing rows stay valid.

BEGIN;

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS servings  integer,
  ADD COLUMN IF NOT EXISTS calories  integer,
  ADD COLUMN IF NOT EXISTS protein_g integer,
  ADD COLUMN IF NOT EXISTS carbs_g   integer,
  ADD COLUMN IF NOT EXISTS fat_g     integer;

-- Sanity-check constraints: macros are estimates but should never be negative
-- and servings must be at least 1 when set. Caps catch obvious AI hallucinations.
ALTER TABLE meals
  ADD CONSTRAINT meals_servings_positive  CHECK (servings  IS NULL OR servings  BETWEEN 1 AND 50),
  ADD CONSTRAINT meals_calories_range     CHECK (calories  IS NULL OR calories  BETWEEN 0 AND 5000),
  ADD CONSTRAINT meals_protein_range      CHECK (protein_g IS NULL OR protein_g BETWEEN 0 AND 500),
  ADD CONSTRAINT meals_carbs_range        CHECK (carbs_g   IS NULL OR carbs_g   BETWEEN 0 AND 500),
  ADD CONSTRAINT meals_fat_range          CHECK (fat_g     IS NULL OR fat_g     BETWEEN 0 AND 500);

COMMIT;
