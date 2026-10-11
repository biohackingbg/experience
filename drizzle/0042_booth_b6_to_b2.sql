-- The October exhibition plan has no B6 (the bar and the hydration station
-- took its place). Whoever was on B6 moves to B2, the free module next to it,
-- unless B2 has been taken in the meantime - then the row is left for a hand
-- decision rather than overwritten.
UPDATE "booth_assignments" SET "booth" = 'B2', "updated_at" = now()
WHERE "booth" = 'B6'
  AND NOT EXISTS (SELECT 1 FROM "booth_assignments" WHERE "booth" = 'B2');
