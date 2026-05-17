-- Track which meal(s) each grocery item came from, so the grocery page can
-- group items "by meal" — useful for shopping one meal at a time, or for
-- answering "which meal did this random ingredient come from?"
--
-- Stores meal *titles* (text[]) rather than meal_ids: the grocery list is a
-- snapshot, and we want it to keep displaying even if a meal is later edited
-- or deleted. Items added freeform via parseAndAddItems leave this empty.
--
-- Run in the Supabase SQL editor.

BEGIN;

ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS meals text[] NOT NULL DEFAULT '{}';

-- Index for the rare case we want to find items by meal — cheap to add, lets
-- a future "show items from X meal" query stay fast even on long lists.
CREATE INDEX IF NOT EXISTS grocery_items_meals_gin_idx
  ON grocery_items USING gin (meals);

COMMIT;
