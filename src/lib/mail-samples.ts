import "server-only";

import {
  type EventInfoInput,
  type ReminderEmailInput,
  type TicketEmailInput,
  eventInfoHtml,
  eventInfoSubject,
  eventInfoText,
  reminderEmailHtml,
  reminderEmailText,
  ticketEmailHtml,
  ticketEmailText,
} from "@/lib/email";
import { daysToEvent } from "@/lib/event-mail";

/**
 * Every mail a buyer can receive, filled with sample data, so the team can
 * read them as the buyer will - the words and the actual rendered page.
 * The samples are invented; no real buyer's data is shown here.
 */

export const MAIL_KINDS = ["bilet", "napomnyane", "predi"] as const;
export type MailKind = (typeof MAIL_KINDS)[number];
export const isMailKind = (v: unknown): v is MailKind => MAIL_KINDS.includes(v as MailKind);

export type MailPreview = {
  kind: MailKind;
  title: string;
  /** When and why the buyer gets it. */
  when: string;
  subject: string;
  html: string;
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
  early: true,
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

export function mailPreview(kind: MailKind): MailPreview {
  switch (kind) {
    case "bilet":
      return {
        kind,
        title: "Билетът",
        when: "Веднага след потвърдено плащане, автоматично. Един път на поръчка; „Прати пак“ в таблото го праща отново.",
        subject: `Билетът ти за Sofia Life Summit · ${ticketSample.reference}`,
        html: ticketEmailHtml(ticketSample),
        text: ticketEmailText(ticketSample),
      };
    case "napomnyane":
      return {
        kind,
        title: "Недовършена поръчка",
        when: "Само на ръка, от бутона „Напомни“ в таблото, най-рано денонощие след спряна поръчка. Никога два пъти, никога на човек, който после е купил.",
        subject: `Билетът ти за Sofia Life Summit чака · ${reminderSample.reference}`,
        html: reminderEmailHtml(reminderSample),
        text: reminderEmailText(reminderSample),
      };
    case "predi": {
      const s = eventSample();
      return {
        kind,
        title: "Преди събитието",
        when: "На ръка, от бутона по-горе, около седмица преди 7 ноември. Всеки купувач го получава веднъж.",
        subject: eventInfoSubject(s.daysLeft),
        html: eventInfoHtml(s),
        text: eventInfoText(s),
      };
    }
  }
}
