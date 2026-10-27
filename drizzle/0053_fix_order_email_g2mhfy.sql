-- A test order was placed under a misspelled address; the tickets follow orders.email.
UPDATE "orders" SET "email" = 'mariya.varsanova@gmail.com'
WHERE "reference" = 'SLS-G2MHFY' AND "email" = 'maria.varsanova@gmail.com';
