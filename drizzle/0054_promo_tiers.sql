-- A code may be limited to some tiers ("core,plus"); empty means every tier.
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "tiers" text;
