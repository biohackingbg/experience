-- Final programme: Saturday 17:45-18:20 is a slot for Кристина Вавура. It goes right after the 17:05 panel.
INSERT INTO "sessions" ("day", "sort", "time", "title", "title_en", "people", "pause")
SELECT 1, p."sort" + 5, '17:45-18:20', 'Кристина Вавура', 'Kristina Vavura', 'Кристина Вавура', false
FROM "sessions" p
WHERE p."day" = 1 AND p."time" = '17:05-17:45'
  AND NOT EXISTS (SELECT 1 FROM "sessions" s WHERE s."day" = 1 AND s."time" = '17:45-18:20')
LIMIT 1;
