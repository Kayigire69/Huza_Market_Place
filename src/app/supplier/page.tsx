import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { SupplierPortalClient } from "./SupplierPortalClient";

export const dynamic = "force-dynamic";

export default async function SupplierPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="section-title">Sell produce to Youth Huza</h1>
        <p className="mt-4 text-[var(--huza-muted)] leading-relaxed">
          Farmers and producers offer stock here so <strong>Youth Huza</strong> can buy it, then sell
          and deliver on <strong>HUZA MARKETPLACE</strong>. You do not sell directly to customers on
          this site — Huza is the buyer and the store.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/auth/register"
            className="rounded-lg bg-[var(--huza-green)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Register as farm partner
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-[var(--huza-line)] px-5 py-2.5 text-sm font-semibold"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const supplier = await prisma.supplier.findFirst({
    where:
      session.user.role === "ADMIN" && !session.user.supplierId
        ? { status: "APPROVED" }
        : { userId: session.user.id },
    include: {
      offers: {
        include: { category: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!supplier) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">Become a farm partner</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Register so Youth Huza can review your farm and buy your produce.
        </p>
        <Link href="/auth/register" className="inline-block mt-6 text-[var(--huza-green)] font-semibold">
          Register →
        </Link>
      </div>
    );
  }

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const purchased = supplier.offers.filter((o) => o.status === "PURCHASED");
  const earnings = purchased.reduce(
    (sum, o) => sum + (o.purchasedQty || o.quantityOffered) * o.askPrice,
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">{supplier.businessName}</h1>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            Status: {supplier.status}
            {supplier.isVerified ? " · Verified partner" : ""} · Offer produce for Youth Huza to buy
          </p>
        </div>
        <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <p className="text-[var(--huza-muted)]">Purchases by Huza (ask price)</p>
          <p className="text-xl font-bold text-[var(--huza-green-dark)]">{formatRwf(earnings)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm text-[var(--huza-muted)]">
        <strong className="text-[var(--huza-ink)]">How it works:</strong> Submit an offer → Huza
        reviews → if accepted, Huza buys your stock and lists it on HUZA MARKETPLACE under Youth Huza.
        Customers pay Huza; Huza pays you for purchased offers.
      </div>

      {supplier.status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] p-4 text-sm">
          Your partner application is <strong>{supplier.status}</strong>. You can prepare offers while
          waiting for Youth Huza approval.
        </div>
      )}

      <SupplierPortalClient supplier={supplier} categories={categories} />
    </div>
  );
}
