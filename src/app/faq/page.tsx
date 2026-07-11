"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";

type Faq = {
  id: string;
  questionEn: string;
  questionFr: string;
  questionRw: string;
  answerEn: string;
  answerFr: string;
  answerRw: string;
};

const fallback: Faq[] = [
  {
    id: "1",
    questionEn: "Who delivers my order?",
    questionFr: "Qui livre ma commande ?",
    questionRw: "Ninde utanga ibicuruzwa?",
    answerEn: "Youth Huza delivers directly — there is no middleman for deliveries.",
    answerFr: "Youth Huza livre directement — pas d'intermédiaire pour les livraisons.",
    answerRw: "Youth Huza itanga ubwayo — nta muntu wo hagati mu gutanga.",
  },
  {
    id: "2",
    questionEn: "Which payment methods are supported?",
    questionFr: "Quels modes de paiement sont acceptés ?",
    questionRw: "Ni ubuhe buryo bwo kwishyura?",
    answerEn:
      "Pay Youth Huza with MTN MoMo or Airtel Money — approve the prompt on your phone. Bank cards are coming soon. Cash on Delivery is not available.",
    answerFr:
      "Payez Youth Huza via MTN MoMo ou Airtel Money — approuvez l’invite sur votre téléphone. Les cartes bancaires arrivent bientôt. Le paiement à la livraison n’est pas disponible.",
    answerRw:
      "Ishyura Youth Huza ukoresheje MTN MoMo cyangwa Airtel Money — emera ubutumire kuri telefone. Amakarita ya banki aza vuba. Nta kwishyura amafaranga iyo bagutegereje.",
  },
  {
    id: "3",
    questionEn: "What are the delivery fees?",
    questionFr: "Quels sont les frais de livraison ?",
    questionRw: "Amafaranga yo gutanga ni angahe?",
    answerEn: "All delivery zones: 5,000 RWF.",
    answerFr: "Toutes les zones : 5 000 RWF.",
    answerRw: "All delivery zones: 5,000 RWF.",
  },
];

export default function FaqPage() {
  const { locale } = useLocale();
  const [faqs, setFaqs] = useState<Faq[]>(fallback);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((d) => {
        if (d.items?.length) setFaqs(d.items);
      })
      .catch(() => undefined);
  }, []);

  const q = (f: Faq) =>
    locale === "fr" ? f.questionFr : locale === "rw" ? f.questionRw : f.questionEn;
  const a = (f: Faq) =>
    locale === "fr" ? f.answerFr : locale === "rw" ? f.answerRw : f.answerEn;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="section-title">FAQ</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Common questions about HUZA FRESH, powered by Youth Huza.
      </p>
      <div className="space-y-4">
        {faqs.map((f) => (
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
