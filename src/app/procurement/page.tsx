import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { ProcurementClient } from "./ProcurementClient";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "PROCUREMENT" && session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const [pendingOffers, allOffers, purchaseOrders, suppliers, messages] = await Promise.all([
    prisma.supplierOffer.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      include: { supplier: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.supplierOffer.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      include: { supplier: { select: { businessName: true } } },
      orderBy: { askPrice: "asc" },
      take: 30,
    }),
    prisma.purchaseOrder.findMany({
      include: { supplier: true, offer: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.supplier.findMany({
      where: { status: "APPROVED" },
      select: { id: true, businessName: true, phone: true, district: true },
      orderBy: { businessName: "asc" },
    }),
    prisma.procurementMessage.findMany({
      include: { supplier: { select: { businessName: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const compareGroups = Object.values(
    allOffers.reduce<
      Record<
        string,
        {
          title: string;
          unit: string;
          offers: { id: string; askPrice: number; supplierName: string; qty: number }[];
        }
      >
    >((acc, o) => {
      const key = `${o.title.toLowerCase()}|${o.unit}`;
      if (!acc[key]) acc[key] = { title: o.title, unit: o.unit, offers: [] };
      acc[key].offers.push({
        id: o.id,
        askPrice: o.askPrice,
        supplierName: o.supplier.businessName,
        qty: o.quantityOffered,
      });
      return acc;
    }, {})
  ).filter((g) => g.offers.length > 1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
        Staff portal
      </p>
      <h1 className="section-title mt-1">Procurement</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-2">
        Review offers, create purchase orders, compare ask prices, and message farmers.
      </p>
      <p className="text-sm text-[var(--huza-muted)] mb-8">
        Open POs:{" "}
        {purchaseOrders.filter((p) => !["PAID", "CANCELLED", "REJECTED"].includes(p.status)).length}{" "}
        · Pending offers: {pendingOffers.length}
        {compareGroups[0]
          ? ` · Lowest ask example: ${formatRwf(Math.min(...compareGroups[0].offers.map((x) => x.askPrice)))}`
          : ""}
      </p>
      <ProcurementClient
        pendingOffers={pendingOffers}
        purchaseOrders={purchaseOrders}
        suppliers={suppliers}
        compareGroups={compareGroups}
        messages={messages}
      />
    </div>
  );
}
