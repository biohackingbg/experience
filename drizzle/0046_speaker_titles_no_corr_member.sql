-- "Член-кор." / "Чл.-кор." is dropped from speaker titles: the team shows
-- "Проф. д-р" for these speakers. Only the prefix goes; the rest of the title stays.
UPDATE "speakers" SET "title" = regexp_replace("title", '^(Член|Чл)\.?-кор\.?\s+', '', 'i') WHERE "title" ~* '^(Член|Чл)\.?-кор';
UPDATE "speakers" SET "title" = upper(left("title", 1)) || substr("title", 2) WHERE "title" ~ '^проф';
UPDATE "speakers" SET "title_en" = regexp_replace("title_en", '^Corr\. Mem\. ', '') WHERE "title_en" LIKE 'Corr. Mem. %';
