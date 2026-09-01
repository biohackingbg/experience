/**
 * The issuing company, as it must appear on an invoice.
 *
 * Public information from the commercial register - nothing here is a secret,
 * which is why it lives in the repository rather than in the environment.
 *
 * Required by ЗДДС чл. 114: the supplier's name, address, identification
 * number and VAT number, plus the name of the person drawing up the invoice.
 */
export const COMPANY = {
  name: "БИОХАКИНГ ООД",
  nameLatin: "Biohacking Ltd.",
  eik: "208570709",
  /** VAT registered 28.11.2025 under чл. 100 ал. 1 - by choice. */
  vatNumber: "BG208570709",
  address:
    "гр. София 1113, р-н Изгрев, жк. Изток, ул. „Фредерик Жолио Кюри“ 4",
  country: "България",
  manager: "Мария Александрова Варсанова",
  email: "hi@biohacking.bg",
  site: "thelongevitysummit.eu",
} as const;

/**
 * The site's own invoice series.
 *
 * Bulgarian practice allows a separate, unbroken range per issuing point, so
 * the website counts in its own band and cannot collide with invoices raised
 * by hand in the accounting system.
 *
 * CONFIRM THIS BEFORE THE FIRST REAL SALE. Once an invoice carries a number it
 * cannot be renumbered, and a gap in the series is exactly what an audit asks
 * about.
 */
export const INVOICE_SERIES_START = 2000000001;
