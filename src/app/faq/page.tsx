import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";
import { FaqClient, type FaqItem } from "./FaqClient";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about HUZA FRESH orders, delivery, and payments.",
};

const fallback: FaqItem[] = [
  {
    id: "1",
    questionEn: "Who delivers my order?",
    questionFr: "Qui livre ma commande ?",
    questionRw: "Ninde utanga ibicuruzwa?",
    answerEn: "Youth Huza delivers directly. There is no middleman for deliveries.",
    answerFr: "Youth Huza livre directement. Pas d'intermédiaire pour les livraisons.",
    answerRw: "Youth Huza itanga ubwayo. Nta muntu wo hagati mu gutanga.",
  },
  {
    id: "2",
    questionEn: "Which payment methods are supported?",
    questionFr: "Quels modes de paiement sont acceptés ?",
    questionRw: "Ni ubuhe buryo bwo kwishyura?",
    answerEn:
      "Pay Youth Huza with MTN MoMo or Airtel Money. Approve the prompt on your phone. Bank cards are coming soon. Cash on Delivery is not available.",
    answerFr:
      "Payez Youth Huza via MTN MoMo ou Airtel Money. Approuvez l’invite sur votre téléphone. Les cartes bancaires arrivent bientôt. Le paiement à la livraison n’est pas disponible.",
    answerRw:
      "Ishyura Youth Huza ukoresheje MTN MoMo cyangwa Airtel Money. Emera ubutumire kuri telefone. Amakarita ya banki aza vuba. Nta kwishyura amafaranga iyo bagutegereje.",
  },
  {
    id: "3",
    questionEn: "What are the delivery fees?",
    questionFr: "Quels sont les frais de livraison ?",
    questionRw: "Amafaranga yo gutanga ni angahe?",
    answerEn:
      "Delivery fee depends on your destination and is shown at checkout when you are about to pay.",
    answerFr: "Les frais de livraison dépendent de votre destination et s'affichent au paiement.",
    answerRw: "Amafaranga yo gutanga aherekeye aho bigenewe kandi agaragara igihe wishyura.",
  },
];

export default async function FaqPage() {
  let items = await cacheGet<FaqItem[]>(CacheKeys.faqList);
  if (!items) {
    try {
      const rows = await prisma.faqItem.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
      });
      items = rows.length
        ? rows.map((r) => ({
            id: r.id,
            questionEn: r.questionEn,
            questionFr: r.questionFr,
            questionRw: r.questionRw,
            answerEn: r.answerEn,
            answerFr: r.answerFr,
            answerRw: r.answerRw,
          }))
        : fallback;
      await cacheSet(CacheKeys.faqList, items, 300);
    } catch {
      items = fallback;
    }
  }

  return <FaqClient items={items.length ? items : fallback} />;
}
