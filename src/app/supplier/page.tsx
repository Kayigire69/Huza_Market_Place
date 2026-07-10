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
        <h1 className="section-title">Supplier portal</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Sell directly to customers through Huza Market Place. Youth Huza handles delivery — no
          middlemen.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/auth/register"
            className="rounded-lg bg-[var(--huza-green)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Register as supplier
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
      products: {
        include: { images: true, category: true, stockLogs: { take: 5, orderBy: { createdAt: "desc" } } },
        orderBy: { updatedAt: "desc" },
      },
      orders: {
        include: {
          order: true,
          product: true,
        },
        orderBy: { order: { createdAt: "desc" } },
        take: 30,
      },
    },
  });

  if (!supplier) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="section-title">Supplier application</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Complete supplier registration to start uploading products.
        </p>
        <Link href="/auth/register" className="inline-block mt-6 text-[var(--huza-green)] font-semibold">
          Register →
        </Link>
      </div>
    );
  }

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const earnings = supplier.orders.reduce((sum, i) => sum + i.lineTotal, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">{supplier.businessName}</h1>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            Status: {supplier.status} · Availability: {supplier.availability} · Hours:{" "}
            {supplier.openHour}:00 – {supplier.closeHour}:00
          </p>
        </div>
        <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <p className="text-[var(--huza-muted)]">Earnings summary</p>
          <p className="text-xl font-bold text-[var(--huza-green-dark)]">{formatRwf(earnings)}</p>
        </div>
      </div>

      {supplier.status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] p-4 text-sm">
          Your supplier application is <strong>{supplier.status}</strong>. You can manage your
          profile while waiting for Youth Huza admin approval.
        </div>
      )}

      <SupplierPortalClient supplier={supplier} categories={categories} />
    </div>
  );
}
