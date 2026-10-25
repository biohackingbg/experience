-- The mid prices stay on until 28 October: only the wording changes (the prices
-- and the stage are left as they are). Does nothing if the row is missing.
UPDATE "settings"
SET "value" = ("value"::jsonb || jsonb_build_object('label', 'до 28 октомври', 'regularAfter', 'след 28 октомври'))::text,
    "updated_at" = now()
WHERE "key" = 'mid_prices' AND "value" ~ '^\s*\{';
