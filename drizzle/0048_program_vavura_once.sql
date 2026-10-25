-- The slot's title is already her name; listing her again as a participant printed it twice.
UPDATE "sessions" SET "people" = NULL WHERE "day" = 1 AND "time" = '17:45-18:20' AND "title" = 'Кристина Вавура';
