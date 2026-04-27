-- Prevent the race in getOrCreatePlan: two near-simultaneous requests for the
-- same user/week were both finding "no plan" and inserting, producing duplicate
-- weekly_plans rows. A unique constraint here lets us swap the find-then-insert
-- pattern for a single upsert with onConflict.
--
-- Run once in Supabase SQL editor. Safe to re-run: ON CONFLICT DO NOTHING on the
-- index creation, and the dedupe step keeps the earliest row per (user, week).

-- 1. Dedupe any existing duplicates, keeping the oldest plan per (user, week).
--    All slots/lists pointing at the duplicates get re-pointed at the survivor first.
WITH ranked AS (
  SELECT id, user_id, week_start_date,
         row_number() OVER (PARTITION BY user_id, week_start_date ORDER BY created_at, id) AS rn
  FROM weekly_plans
),
keepers AS (
  SELECT user_id, week_start_date, id AS keep_id FROM ranked WHERE rn = 1
),
losers AS (
  SELECT r.id AS loser_id, k.keep_id
  FROM ranked r
  JOIN keepers k ON k.user_id = r.user_id AND k.week_start_date = r.week_start_date
  WHERE r.rn > 1
)
UPDATE weekly_plan_slots s
SET plan_id = l.keep_id
FROM losers l
WHERE s.plan_id = l.loser_id;

WITH ranked AS (
  SELECT id, user_id, week_start_date,
         row_number() OVER (PARTITION BY user_id, week_start_date ORDER BY created_at, id) AS rn
  FROM weekly_plans
),
keepers AS (
  SELECT user_id, week_start_date, id AS keep_id FROM ranked WHERE rn = 1
),
losers AS (
  SELECT r.id AS loser_id, k.keep_id
  FROM ranked r
  JOIN keepers k ON k.user_id = r.user_id AND k.week_start_date = r.week_start_date
  WHERE r.rn > 1
)
UPDATE grocery_lists g
SET plan_id = l.keep_id
FROM losers l
WHERE g.plan_id = l.loser_id;

DELETE FROM weekly_plans p
USING (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id, week_start_date ORDER BY created_at, id) AS rn
    FROM weekly_plans
  ) t WHERE rn > 1
) d
WHERE p.id = d.id;

-- 2. Add the unique constraint.
ALTER TABLE weekly_plans
  ADD CONSTRAINT weekly_plans_user_week_unique
  UNIQUE (user_id, week_start_date);
