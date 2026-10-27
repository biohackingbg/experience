-- The person who represents the buyer's company (МОЛ), printed on the invoice when it is known.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_mol" text;--> statement-breakpoint
UPDATE "orders" SET "invoice_mol" = 'Николай Козанов'
WHERE "reference" = 'SLS-375V8C' AND "invoice_number" = 2000000150;
