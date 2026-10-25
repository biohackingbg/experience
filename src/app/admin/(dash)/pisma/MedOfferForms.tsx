"use client";

import { useActionState } from "react";

import { type MailState, addMedRecipients, saveMedText, sendMedAll, sendMedTestAction } from "./actions";

const initial: MailState = { status: "idle" };
const field = "w-full rounded-xl border border-bh-ink/15 bg-bh-paper px-4 py-2.5 text-sm text-bh-ink placeholder:text-bh-ink/35";
const msg = (s: MailState) =>
  s.status !== "idle" && <p className={`mt-2 text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</p>;

export function MedTextForm({ subject, body }: { subject: string; body: string }) {
  const [state, action, pending] = useActionState(saveMedText, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="subject" defaultValue={subject} className={field} aria-label="Тема" />
      <textarea name="body" defaultValue={body} rows={22} className={`${field} font-mono text-[0.8rem] leading-relaxed`} aria-label="Текст" />
      <p className="text-xs text-bh-ink/50">
        Празен ред = нов абзац. Редове, започващи с „- “, стават точки. **Така** е удебелено. {"{{name}}"} е малкото име,
        {" {{holder}}, {{iban}}, {{bic}}, {{bank}}"} идват от банковите данни.
      </p>
      <div>
        <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">
          {pending ? "Записва…" : "Запиши текста"}
        </button>
        {msg(state)}
      </div>
    </form>
  );
}

export function MedAddForm() {
  const [state, action, pending] = useActionState(addMedRecipients, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <textarea name="people" rows={4} className={`${field} font-mono text-[0.8rem]`} placeholder={"Име Фамилия; имейл\nПо един човек на ред"} aria-label="Нови получатели" />
      <div>
        <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">
          {pending ? "Добавя…" : "Добави в списъка"}
        </button>
        {msg(state)}
      </div>
    </form>
  );
}

export function MedTestForm() {
  const [state, action, pending] = useActionState(sendMedTestAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="email" name="to" required placeholder="твоят имейл" className="w-64 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35" />
      <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">
        {pending ? "Изпраща…" : "Прати тест"}
      </button>
      <span className="basis-full">{msg(state)}</span>
    </form>
  );
}

export function MedSendForm({ waiting }: { waiting: number }) {
  const [state, action, pending] = useActionState(sendMedAll, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Пращаш писмото до ${waiting} души? Всеки го получава само веднъж.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending || waiting === 0}
        className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {pending ? "Изпраща…" : waiting === 0 ? "Всички са получили писмото" : `Прати до ${waiting} души`}
      </button>
      {msg(state)}
    </form>
  );
}
