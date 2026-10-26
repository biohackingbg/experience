-- The mid prices now run to 30 October: only the wording changes (the prices and the stage are left as they are).
UPDATE "settings"
SET "value" = ("value"::jsonb || jsonb_build_object('label', 'до 30 октомври', 'regularAfter', 'след 30 октомври'))::text,
    "updated_at" = now()
WHERE "key" = 'mid_prices' AND "value" ~ '^\s*\{';
