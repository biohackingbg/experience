import "server-only";

import {
  type AccessLinkInput,
  type DocumentEmailInput,
  type EventInfoInput,
  type ListMailInput,
  type ProformaEmailInput,
  type ReminderEmailInput,
  type SaleAlertInput,
  type TicketEmailInput,
  type WaitlistEmailInput,
  accessLinkParts,
  documentEmailParts,
  eventInfoHtml,
  eventInfoSubject,
  eventInfoText,
  listMailHtml,
  listMailText,
  proformaEmailHtml,
  proformaEmailSubject,
  proformaEmailText,
  reminderEmailHtml,
  reminderEmailText,
  saleAlertParts,
  ticketEmailHtml,
  ticketEmailText,
  waitlistEmailParts,
} from "@/lib/email";
import { buildDigest } from "@/lib/digest";
import { getMailTexts } from "@/lib/mail-texts";
import { daysToEvent } from "@/lib/event-mail";

/**
 * Every letter this site sends, filled with sample data, so the team can read
 * them as the recipient will - the words and the actual rendered page. The
 * samples are invented; no real buyer's data is shown here. The one
 * exception is the daily digest, which is built from today's real numbers,
 * because a made-up digest would say nothing about how it reads.
 */

export const MAIL_KINDS = [
  "bilet",
  "proforma",
  "napomnyane",
  "chakasht",
  "predi",
  "dokument-proforma",
  "dokument-faktura",
  "byuletin",
  "dostap",
  "prodazhba",
  "spravka",
] as const;
export type MailKind = (typeof MAIL_KINDS)[number];
export const isMailKind = (v: unknown): v is MailKind => MAIL_KINDS.includes(v as MailKind);

/** Who the letter is for - the three headings on the Писма page. */
export const MAIL_GROUPS = [
  { id: "kupuvachi", label: "До купувачите на билети" },
  { id: "firmi", label: "До фирми, партньори и абонати" },
  { id: "ekip", label: "До нас" },
] as const;
export type MailGroup = (typeof MAIL_GROUPS)[number]["id"];

export type MailPreview = {
  kind: MailKind;
  group: MailGroup;
  title: string;
  /** When and why it goes out, and whether anyone has to press anything. */
  when: string;
  /** True when nothing sends it by itself. */
  manual?: boolean;
  subject: string;
  /** Null for the plain-text letters - an alert is not a newsletter. */
  html: string | null;
  text: string;
};

const ticketSample: TicketEmailInput = {
  to: "",
  buyerName: "Иван",
  reference: "SLS-ПРИМЕР",
  totalCents: 17800,
  invoiceNumber: 1042,
  tickets: [
    { code: "ABCD-EFGH", tierName: "PLUS" },
    { code: "JKLM-NPQR", tierName: "PLUS" },
  ],
};

const reminderSample: ReminderEmailInput = {
  to: "",
  buyerName: "Иван",
  reference: "SLS-ПРИМЕР",
  items: "2× PLUS",
  resumePath: "/bilet?nivo=plus",
  offer: "стартовите цени за първите 200 билета",
};

export function eventSample(): EventInfoInput {
  return {
    to: "",
    buyerName: "Иван",
    reference: "SLS-ПРИМЕР",
    daysLeft: daysToEvent(),
    tickets: [
      { code: "ABCD-EFGH", tierName: "PLUS", attendeeName: null },
      { code: "JKLM-NPQR", tierName: "PLUS", attendeeName: "Мария Иванова" },
    ],
  };
}

const bankSample = { holder: "Биохакинг ЕООД", iban: "BG00XXXX00000000000000", bic: "XXXXBGSF", bank: "Пример Банк" };
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

const proformaSample: ProformaEmailInput = {
  to: "",
  buyerName: "Иван",
  reference: "SLS-ПРИМЕР",
  totalCents: 17800,
  items: "2× PLUS",
  dueAt: inDays(3),
  bank: bankSample,
};

const waitlistSample: WaitlistEmailInput = { to: "", tierName: "PLUS", tierId: "plus", left: 2 };

const documentSample: DocumentEmailInput = {
  to: "",
  buyerName: "Белослава",
  company: "Пример ООД",
  reference: "DOC-ПРИМЕР",
  totalCents: 216000,
  // No package name in the sample: a level here reads as if the system had
  // decided one, and nothing in it ever does - the line comes from the deal.
  items: "1× Партньорски пакет · Sofia Life Summit 2026",
  dueAt: inDays(7),
  bank: bankSample,
};

const invoiceSample: DocumentEmailInput = { ...documentSample, dueAt: null, bank: undefined, invoiceNumber: 1042 };

const listSample: ListMailInput = {
  to: "",
  name: "Иван",
  subject: "Програмата за 7 и 8 ноември е готова",
  body:
    "Осемнайсет лекции и панела, четири зони и Village с трийсет компании - всичко е вече на сайта.\n\n" +
    "Лекторите са от осем държави и говорят по 25 минути, на разбираем език. Ако отдавна си обещаваш да се погрижиш за здравето си, това е добър уикенд за начало.",
  ctaLabel: "Виж програмата",
  ctaUrl: "https://thelongevitysummit.eu/programa",
};
const listUnsubSample = "https://thelongevitysummit.eu/otpisvane/ПРИМЕР";

const accessSample: AccessLinkInput = {
  to: "",
  label: "Метрикс",
  link: "https://thelongevitysummit.eu/admin/vhod/ПРИМЕР",
  pages: ["Реклама", "Посещения"],
};

const saleSample: SaleAlertInput = {
  reference: "SLS-ПРИМЕР",
  buyerName: "Иван Иванов",
  items: "2× PLUS",
  totalCents: 17800,
  method: "card",
  soldTotal: 214,
  capacity: 900,
};

export async function mailPreview(kind: MailKind): Promise<MailPreview> {
  // The preview must show the wording as it is now, not as it shipped.
  const t = await getMailTexts();
  switch (kind) {
    case "bilet":
      return {
        kind,
        group: "kupuvachi",
        title: "Билетът",
        when: "Веднага след потвърдено плащане, автоматично. Един път на поръчка; „Прати пак“ в Dashboard го праща отново.",
        subject: `Билетът ти за Sofia Life Summit · ${ticketSample.reference}`,
        html: ticketEmailHtml(ticketSample, t),
        text: ticketEmailText(ticketSample, t),
      };
    case "proforma":
      return {
        kind,
        group: "kupuvachi",
        title: "Проформа за билети по банков път",
        when: "Автоматично, щом някой избере плащане по банков път. Съдържа сметката и срока; билетите тръгват чак когато отбележиш поръчката като платена.",
        subject: proformaEmailSubject(proformaSample, t),
        html: proformaEmailHtml(proformaSample, t),
        text: proformaEmailText(proformaSample, t),
      };
    case "napomnyane":
      return {
        kind,
        group: "kupuvachi",
        title: "Недовършена поръчка",
        manual: true,
        when: "Само на ръка, от бутона „Напомни“ в Dashboard, най-рано денонощие след спряна поръчка. Никога два пъти, никога на човек, който после е купил.",
        subject: `Билетът ти за Sofia Life Summit чака · ${reminderSample.reference}`,
        html: reminderEmailHtml(reminderSample, t),
        text: reminderEmailText(reminderSample, t),
      };
    case "chakasht": {
      const m = waitlistEmailParts(waitlistSample, t);
      return {
        kind,
        group: "kupuvachi",
        title: "Освободи се място",
        when: "Автоматично, на записалите се за чакащ списък, когато място от тяхното ниво се освободи. Всеки го получава само веднъж.",
        subject: m.subject,
        html: m.html,
        text: m.text,
      };
    }
    case "predi": {
      const s = eventSample();
      return {
        kind,
        group: "kupuvachi",
        title: "Преди събитието",
        manual: true,
        when: "На ръка, от бутона по-горе, около седмица преди 7 ноември. Всеки купувач го получава веднъж.",
        subject: eventInfoSubject(s.daysLeft),
        html: eventInfoHtml(s, t),
        text: eventInfoText(s, t),
      };
    }
    case "dokument-proforma": {
      const m = documentEmailParts("proforma", documentSample, t);
      return {
        kind,
        group: "firmi",
        title: "Проформа (спонсорство, такса, услуга)",
        when: "Автоматично, в момента, в който направиш проформата в „Проформи и фактури“. Бутонът „Изпрати проформа“ я праща пак.",
        subject: m.subject,
        html: m.html,
        text: m.text,
      };
    }
    case "dokument-faktura": {
      const m = documentEmailParts("invoice", invoiceSample, t);
      return {
        kind,
        group: "firmi",
        title: "Фактура (спонсорство, такса, услуга)",
        when: "Автоматично, щом отбележиш документа като платен и номерът се издаде. Бутонът „Изпрати фактура“ я праща пак.",
        subject: m.subject,
        html: m.html,
        text: m.text,
      };
    }
    case "byuletin":
      return {
        kind,
        group: "firmi",
        title: "Бюлетин до списъка",
        manual: true,
        when: "На ръка, от „Записвания“ - текстът е този, който напишеш там. Всяко писмо носи собствена връзка за отписване.",
        subject: listSample.subject,
        html: listMailHtml(listSample, listUnsubSample),
        text: listMailText(listSample, listUnsubSample),
      };
    case "dostap": {
      const m = accessLinkParts(accessSample, t);
      return {
        kind,
        group: "firmi",
        title: "Покана за достъп до администрацията",
        when: "Автоматично, когато дадеш достъп на човек от „Достъп“. Връзката важи месец, влизането - три.",
        subject: m.subject,
        html: m.html,
        text: m.text,
      };
    }
    case "prodazhba": {
      const m = saleAlertParts(saleSample);
      return {
        kind,
        group: "ekip",
        title: "Известие за продажба",
        when: "Автоматично, при всяка платена поръчка. Отива на нашия адрес, не на купувача - затова е само текст.",
        subject: m.subject,
        html: null,
        text: m.text,
      };
    }
    case "spravka": {
      const d = await buildDigest();
      return {
        kind,
        group: "ekip",
        title: "Дневната справка",
        when: "Автоматично, всяка сутрин, до нашия адрес. Показаното тук е днешната истинска справка, не пример.",
        subject: d.subject,
        html: d.html,
        text: d.text,
      };
    }
  }
}
