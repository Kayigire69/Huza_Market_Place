import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupportCenterClient } from "./SupportCenterClient";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  let userPhone: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });
    userPhone = user?.phone ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
        Youth Huza
      </p>
      <h1 className="section-title mt-1">Customer Support Center</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Open a ticket, browse the FAQ, or reach us on WhatsApp — we are here for HUZA FRESH
        customers.
      </p>
      <SupportCenterClient userName={session?.user?.name} userPhone={userPhone} />
    </div>
  );
}
