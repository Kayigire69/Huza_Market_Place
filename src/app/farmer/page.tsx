import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { FarmerPortalClient } from "./FarmerPortalClient";
import { FarmerRegisterForm } from "./FarmerRegisterForm";
import { DemoCredentials } from "@/components/portals/DemoCredentials";

export const dynamic = "force-dynamic";

const FARMER_DEMO = [
  {
    label: "Approved farmer — Green Valley Farm",
    email: "greenvalley@farm.rw",
    password: "password123",
    note: "Full portal: products, inventory, incoming orders",
  },
  {
    label: "Pending farmer — Sunrise Honey Co-op",
    email: "newfarm@example.rw",
    password: "password123",
    note: "Waiting for admin approval — profile only until approved",
  },
];

export default async function FarmerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
            Module 9 · Separate from customer shop
          </p>
          <h1 className="section-title mt-2">Farmers Portal</h1>
          <p className="mt-4 text-[var(--huza-muted)] leading-relaxed max-w-2xl mx-auto">
            Register your farm so <strong>Youth Huza</strong> can buy your produce for{" "}
            <strong>HUZA FRESH</strong>. After admin approval you upload products, manage inventory,
            and view incoming purchase orders. Customers shop only on the storefront — not here.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/" className="text-[var(--huza-muted)] hover:underline">
              ← Customer storefront
            </Link>
            {" · "}
            <Link href="/admin" className="font-semibold text-[var(--huza-green)]">
              Admin portal
            </Link>
          </p>
        </div>
        <DemoCredentials title="Demo farmer logins" credentials={FARMER_DEMO} />
        <FarmerRegisterForm />
      </div>
    );
  }

  if (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const farmer = await prisma.supplier.findFirst({
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
      products: {
        include: { category: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!farmer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">Become a verified farmer</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Register so Youth Huza can verify your farm and buy your produce.
        </p>
        <Link href="/farmer" className="inline-block mt-6 text-[var(--huza-green)] font-semibold">
          Apply →
        </Link>
      </div>
    );
  }

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const purchased = farmer.offers.filter((o) => o.status === "PURCHASED");
  const earnings = purchased.reduce(
    (sum, o) => sum + (o.purchasedQty || o.quantityOffered) * o.askPrice,
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
            Farmers Portal · Sell to Youth Huza
          </p>
          <h1 className="section-title mt-1">{farmer.businessName}</h1>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            Status: {farmer.status}
            {farmer.isVerified ? " · Verified" : ""} · Not a customer storefront
          </p>
          {farmer.rejectionReason && (
            <p className="text-sm text-red-700 mt-1">Reason: {farmer.rejectionReason}</p>
          )}
          {farmer.adminNotes && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">Admin note: {farmer.adminNotes}</p>
          )}
          {farmer.inspectionScheduledAt && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">
              Farm inspection scheduled: {farmer.inspectionScheduledAt.toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <p className="text-[var(--huza-muted)]">Purchases by Huza</p>
          <p className="text-xl font-bold text-[var(--huza-green-dark)]">{formatRwf(earnings)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm text-[var(--huza-muted)]">
        <strong className="text-[var(--huza-ink)]">How it works:</strong> Get verified by admin →
        upload products &amp; manage inventory → Huza issues purchase orders → deliver to Huza
        warehouse → Huza pays you. Stock is sold on HUZA FRESH under Youth Huza.
      </div>

      {farmer.status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] p-4 text-sm">
          Your application is <strong>{farmer.status}</strong>. Complete your profile and documents
          while Youth Huza verifies your farm. Product upload unlocks after approval.
        </div>
      )}

      <FarmerPortalClient farmer={farmer} categories={categories} />
    </div>
  );
}
