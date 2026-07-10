import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { SupplierPortalClient } from "./SupplierPortalClient";
import { SupplierRegisterForm } from "./SupplierRegisterForm";

export const dynamic = "force-dynamic";

export default async function SupplierPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
            Youth Huza procurement
          </p>
          <h1 className="section-title mt-2">Supplier Procurement Portal</h1>
          <p className="mt-4 text-[var(--huza-muted)] leading-relaxed max-w-2xl mx-auto">
            Register to sell produce <strong>to Youth Huza only</strong>. After verification you
            submit wholesale offers; Huza inspects, issues purchase orders, and pays you. There are
            no customer orders, no customer prices, and no customer delivery on this portal —
            customers buy from <strong>HUZA MARKETPLACE</strong>, not from you.
          </p>
        </div>
        <SupplierRegisterForm />
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
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!supplier) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">Become a verified supplier</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Register so Youth Huza can verify your farm and buy your produce. You sell to Huza only —
          not to end customers.
        </p>
        <Link href="/supplier" className="inline-block mt-6 text-[var(--huza-green)] font-semibold">
          Apply →
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
            Supplier Management Portal
          </p>
          <h1 className="section-title mt-1">{supplier.businessName}</h1>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            Status: {supplier.status}
            {supplier.isVerified ? " · Verified" : ""} · Sell to Youth Huza only
          </p>
          {supplier.rejectionReason && (
            <p className="text-sm text-red-700 mt-1">Reason: {supplier.rejectionReason}</p>
          )}
          {supplier.inspectionScheduledAt && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">
              Farm inspection scheduled: {supplier.inspectionScheduledAt.toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <p className="text-[var(--huza-muted)]">Purchases by Huza</p>
          <p className="text-xl font-bold text-[var(--huza-green-dark)]">{formatRwf(earnings)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm text-[var(--huza-muted)]">
        <strong className="text-[var(--huza-ink)]">B2B with Youth Huza only:</strong> Get verified
        → submit a wholesale offer → Huza reviews → purchase order → deliver to Huza warehouse →
        Huza pays you. No customer orders, no customer pricing, no customer delivery — Huza lists
        stock on HUZA MARKETPLACE under Youth Huza.
      </div>

      {supplier.status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] p-4 text-sm">
          Your application is <strong>{supplier.status}</strong>. Complete your profile and documents
          while Youth Huza verifies your farm.
        </div>
      )}

      <SupplierPortalClient supplier={supplier} categories={categories} />
    </div>
  );
}
