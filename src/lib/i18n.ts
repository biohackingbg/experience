/**
 * The buyer-facing words in two languages. Bulgarian is the site; English
 * covers the checkout, the ticket, the thank-you page and the mails, which
 * is what a foreign speaker's guest actually touches. Client-safe.
 */
export type Lang = "bg" | "en";
export const isLang = (v: unknown): v is Lang => v === "bg" || v === "en";
export const langOf = (v: unknown): Lang => (v === "en" ? "en" : "bg");

export const CHECKOUT = {
  bg: {
    back: "← Обратно към сайта",
    switchTo: "English",
    switchHref: "?lang=en",
    title: "Купи билет",
    intro: "Sofia Life Summit · 07-08 ноември 2026 · Гранд Хотел Милениум, София. Цените са крайни, с включен ДДС.",
    launchPrice: "Стартова цена",
    specialPrice: "Специална цена",
    priceNote: (label: string, launch: boolean) => `- тази цена важи ${launch ? "за " : ""}${label}. Плащаш сега, билетът и мястото ти са запазени, а програмата се допълва до събитието.`,
    cancelled: "Плащането беше прекратено. Поръчката не е завършена - можеш да опиташ отново.",
    testMode: "Тестов режим. Плащанията не са истински. Използвай карта 4242 4242 4242 4242 с произволна бъдеща дата и CVC.",
    tier: "Ниво",
    soldOut: "изчерпано",
    quantity: "Брой",
    name: "Име и фамилия",
    email: "Имейл",
    phone: "Телефон (по избор)",
    promo: "Промо код (ако имаш)",
    promoPlaceholder: "напр. STUDENT",
    apply: "Приложи",
    checking: "Проверява…",
    promoOk: (code: string, label: string) => `Кодът ${code} важи: ${label}.`,
    wantInvoice: "Искам фактура на фирма",
    company: "Фирма",
    vatNumber: "ЕИК / ДДС номер",
    address: "Адрес",
    summary: "Поръчка",
    discount: "Отстъпка",
    net: "Данъчна основа",
    vat: "ДДС 20%",
    toPay: "За плащане",
    fullTerms: "Пълни условия",
    redirecting: "Пренасочвам към плащане…",
    issuing: "Издавам билета…",
    free: "Вземи билета безплатно",
    pay: (amount: string) => `Плати ${amount} €`,
    stripe: "Плащането се обработва от Stripe. Не съхраняваме данни за карти.",
  },
  en: {
    back: "← Back to the site",
    switchTo: "Български",
    switchHref: "?lang=bg",
    title: "Buy a ticket",
    intro: "Sofia Life Summit · 7-8 November 2026 · Grand Hotel Millennium, Sofia. Prices are final, VAT included.",
    launchPrice: "Launch price",
    specialPrice: "Special price",
    priceNote: (label: string) => `- this price applies ${label}. Pay now, your ticket and seat are secured, and the programme fills in up to the event.`,
    cancelled: "The payment was cancelled. The order is not complete - you can try again.",
    testMode: "Test mode. Payments are not real. Use card 4242 4242 4242 4242 with any future date and CVC.",
    tier: "Ticket",
    soldOut: "sold out",
    quantity: "Quantity",
    name: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    promo: "Promo code (if you have one)",
    promoPlaceholder: "e.g. STUDENT",
    apply: "Apply",
    checking: "Checking…",
    promoOk: (code: string, label: string) => `Code ${code} applies: ${label}.`,
    wantInvoice: "I need a company invoice",
    company: "Company",
    vatNumber: "Company / VAT number",
    address: "Address",
    summary: "Order",
    discount: "Discount",
    net: "Net",
    vat: "VAT 20%",
    toPay: "Total",
    fullTerms: "Full terms",
    redirecting: "Redirecting to payment…",
    issuing: "Issuing your ticket…",
    free: "Get the ticket for free",
    pay: (amount: string) => `Pay €${amount}`,
    stripe: "Payments are processed by Stripe. We never store card details.",
  },
} as const;

export const TICKET_PAGE = {
  bg: { ticketFor: "Билет за", show: "Покажи този код на входа", when: "Кога", where: "Къде", attendee: "Участник", order: "Поръчка", used: "Този билет вече е използван на", keep: "Запази страницата или я разпечатай. Билетът важи за един човек.", dates: "07-08 ноември 2026", venue: "Гранд Хотел Милениум, София",
    whoTitle: "Име на участника", whoAsk: "За кого е този билет?", whoHint: "Ако билетът е за друг човек, напиши името му - така ще го намерим на входа и баджът ще е с неговото име. Ако е за теб, остави празно.", whoPlaceholder: "Име и фамилия", save: "Запиши", saving: "Записва…" },
  en: { ticketFor: "Ticket for", show: "Show this code at the entrance", when: "When", where: "Where", attendee: "Attendee", order: "Order", used: "This ticket was already used on", keep: "Save this page or print it. One ticket admits one person.", dates: "7-8 November 2026", venue: "Grand Hotel Millennium, Sofia",
    whoTitle: "Attendee name", whoAsk: "Who is this ticket for?", whoHint: "If the ticket is for someone else, write their name - that is how we find them at the entrance and print their badge. If it is for you, leave it empty.", whoPlaceholder: "Full name", save: "Save", saving: "Saving…" },
} as const;

export const SUCCESS = {
  bg: { eyebrow: "Плащането е прието", title: "Благодарим!", body: "Билетът ти се издава в момента. Ще получиш имейл с потвърждение и самия билет до няколко минути. Ако не пристигне, провери папката със спам.", ref: "Номер на поръчка", keep: "Пази този номер - с него можем да намерим поръчката ти при въпрос.", back: "Обратно към сайта" },
  en: { eyebrow: "Payment received", title: "Thank you!", body: "Your ticket is being issued. A confirmation email with the ticket itself arrives within a few minutes. If it does not, check your spam folder.", ref: "Order number", keep: "Keep this number - it is how we find your order if you have a question.", back: "Back to the site" },
} as const;
