"use client";

import { useLocale } from "@/lib/locale-context";

export type FaqItem = {
  id: string;
  questionEn: string;
  questionFr: string;
  questionRw: string;
  answerEn: string;
  answerFr: string;
  answerRw: string;
};

export function FaqClient({ items }: { items: FaqItem[] }) {
  const { locale } = useLocale();

  const q = (f: FaqItem) =>
    locale === "fr" ? f.questionFr : locale === "rw" ? f.questionRw : f.questionEn;
  const a = (f: FaqItem) =>
    locale === "fr" ? f.answerFr : locale === "rw" ? f.answerRw : f.answerEn;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="section-title">FAQ</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Common questions about HUZA FRESH, powered by Youth Huza.
      </p>
      <div className="space-y-4">
        {items.map((f) => (
          <details
            key={f.id}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 group"
          >
            <summary className="cursor-pointer font-semibold list-none flex justify-between gap-3">
              {q(f)}
              <span className="text-[var(--huza-green)] group-open:rotate-45 transition">+</span>
            </summary>
            <p className="mt-3 text-sm text-[var(--huza-muted)] leading-relaxed">{a(f)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
