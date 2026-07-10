import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FarmerPortalClient } from "./FarmerPortalClient";
import { FarmerRegisterForm } from "./FarmerRegisterForm";
import { DemoCredentials } from "@/components/portals/DemoCredentials";

export const dynamic = "force-dynamic";

const FARMER_DEMO = [
  {
    label: "Approved farmer — Green Valley Farm",
    email: "greenvalley@farm.rw",
    password: "password123",
    note: "List products with photos, manage inventory & profile",
  },
  {
    label: "Pending farmer — Sunrise Honey Co-op",
    email: "newfarm@example.rw",
    password: "password123",
    note: "Waiting for admin / agent approval",
  },
];

export default async function FarmerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
            Farmers Portal · Separate from customer shop
          </p>
          <h1 className="section-title mt-2">Farmers Portal</h1>
          <p className="mt-4 text-[var(--huza-muted)] leading-relaxed max-w-2xl mx-auto">
            Register your farm so <strong>Youth Huza</strong> can buy your produce for{" "}
            <strong>HUZA FRESH</strong>. Huza field agents visit farms to help you register and list
            products with photos. Huza does <strong>not</strong> place online purchase orders here —
            agents work with you on the ground. Customers shop only on the storefront.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/" className="text-[var(--huza-muted)] hover:underline">
              ← Customer storefront
            </Link>
            {" · "}
            <Link href="/auth/login" className="font-semibold text-[var(--huza-green)]">
              Farmer login
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
      products: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!farmer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">Become a verified farmer</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Register so a Huza agent can help verify your farm and list your produce.
        </p>
        <Link href="/farmer" className="inline-block mt-6 text-[var(--huza-green)] font-semibold">
          Apply →
        </Link>
      </div>
    );
  }

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const listed = farmer.products.length;

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
            {farmer.isVerified ? " · Verified" : ""} · Agent-assisted selling
          </p>
          {farmer.rejectionReason && (
            <p className="text-sm text-red-700 mt-1">Reason: {farmer.rejectionReason}</p>
          )}
          {farmer.adminNotes && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">Admin note: {farmer.adminNotes}</p>
          )}
          {farmer.inspectionScheduledAt && (
            <p className="text-sm text-[var(--huza-muted)] mt-1">
              Agent / farm visit scheduled: {farmer.inspectionScheduledAt.toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <p className="text-[var(--huza-muted)]">Products listed</p>
          <p className="text-xl font-bold text-[var(--huza-green-dark)]">{listed}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm text-[var(--huza-muted)]">
        <strong className="text-[var(--huza-ink)]">How it works:</strong> A Huza agent helps you
        register and get approved → you upload each product with photos and stock → Huza reviews and
        buys through agents (not online orders in this portal) → stock is sold on HUZA FRESH under
        Youth Huza.
      </div>

      {farmer.status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] p-4 text-sm">
          Your application is <strong>{farmer.status}</strong>. Complete your profile and documents.
          A Huza agent may visit your farm. Product listing unlocks after approval.
        </div>
      )}

      <FarmerPortalClient farmer={farmer} categories={categories} />
    </div>
  );
}
