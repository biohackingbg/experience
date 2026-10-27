-- Invoice 2000000150 (order SLS-375V8C) went out without the buyer's company ID and VAT number.
-- Kings' Valley's accountant asked for them to be added; amounts, number and date stay as issued.
UPDATE "orders"
SET "invoice_vat_number" = '200285944 / BG200285944',
    "invoice_address" = 'гр. София, ул. Вискяр планина №12'
WHERE "reference" = 'SLS-375V8C' AND "invoice_number" = 2000000150;
