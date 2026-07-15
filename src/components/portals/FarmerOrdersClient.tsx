"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FarmerPanel } from "@/components/portals/FarmerUi";
import {
  FarmerQualityReviewCard,
  defaultQualityRecommendation,
} from "@/components/portals/FarmerQualityReviewCard";
import { Button } from "@/components/ui/Button";
import type { FarmerPurchaseOrderRow } from "@/lib/farmer-workspace";
import { formatRwf, formatUnit } from "@/lib/utils";
import { ArrowRight, ClipboardList, PackageCheck } from "lucide-react";

type Filter = "all" | "active" | "accepted" | "rejected" | "paid";

function statusChip(status: string) {
  if (status === "PAID" || status === "ACCEPTED") {
    return "bg-[var(--huza-mint)] text-[var(--huza-green-dark)]";
  }
  if (status === "REJECTED" || status === "CANCELLED") {
    return "bg-red-50 text-red-800";
  }
  if (status === "INSPECTED" || status === "RECEIVED") {
    return "bg-amber-50 text-amber-900";
  }
  return "bg-white text-[var(--huza-ink)] ring-1 ring-[var(--huza-line)]";
}

function matchesFilter(po: FarmerPurchaseOrderRow, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "paid") return Boolean(po.paidAt) || po.status === "PAID";
  if (filter === "rejected") return po.status === "REJECTED" || po.status === "CANCELLED";
  if (filter === "accepted") return po.status === "ACCEPTED" || po.status === "PAID";
  // active pipeline
  return !["REJECTED", "CANCELLED", "PAID"].includes(po.status);
}

/**
 * Phase 4 Purchase Orders — harvest buys from Youth Huza, not a retail order list.
 */
export function FarmerOrdersClient({ orders }: { orders: FarmerPurchaseOrderRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((po) => matchesFilter(po, "active")).length,
      accepted: orders.filter((po) => matchesFilter(po, "accepted")).length,
      rejected: orders.filter((po) => matchesFilter(po, "rejected")).length,
      paid: orders.filter((po) => matchesFilter(po, "paid")).length,
    };
  }, [orders]);

  const visible = useMemo(
    () => orders.filter((po) => matchesFilter(po, filter)),
    [orders, filter]
  );

  const openValue = orders
    .filter((po) => matchesFilter(po, "active"))
    .reduce((sum, po) => sum + po.totalAmount, 0);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "In progress", count: counts.active },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "paid", label: "Paid", count: counts.paid },
  ];

  if (orders.length === 0) {
    return (
      <FarmerPanel className="max-w-2xl">
        <ClipboardList className="h-8 w-8 text-[var(--huza-green)]" />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
          No purchase orders yet
        </h2>
        <p className="mt-2 text-sm text-[var(--huza-muted)]">
          When Youth Huza buys your harvest, the order appears here with quantity, inspection, and payment follow-up.
        </p>
        <Link href="/farmer/products" className="mt-4 inline-block">
          <Button className="gap-2">
            Keep crop supply ready <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </FarmerPanel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            Purchase orders
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--huza-green-dark)]">
            {counts.all}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            In progress
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-amber-800">
            {counts.active}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            Open value
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
            {formatRwf(openValue)}
          </p>
        </FarmerPanel>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === f.key
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-line)]"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.map((po) => (
          <FarmerPanel key={po.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-[var(--huza-green-dark)]">{po.poNumber}</p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
                  {po.productName}
                </h3>
                <p className="mt-1 text-sm text-[var(--huza-muted)]">
                  {po.quantity.toLocaleString()} {formatUnit(po.unit)}
                  {po.category ? ` · ${po.category}` : ""} · {formatRwf(po.negotiatedPrice)}/
                  {formatUnit(po.unit)}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusChip(po.status)}`}>
                {po.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--huza-mint)]/50 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                  Order value
                </p>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-green-dark)]">
                  {formatRwf(po.totalAmount)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--huza-line)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                  Payment
                </p>
                <p className="text-sm font-semibold text-[var(--huza-ink)]">{po.paymentStatus}</p>
              </div>
              <div className="rounded-xl border border-[var(--huza-line)] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                  Timeline
                </p>
                <p className="text-xs text-[var(--huza-muted)]">
                  Created {new Date(po.createdAt).toLocaleDateString()}
                  {po.inspectedAt
                    ? ` · Inspected ${new Date(po.inspectedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            </div>

            {po.qualityNotes ? (
              <p className="mt-3 rounded-lg bg-[var(--huza-mint)]/40 px-3 py-2 text-sm text-[var(--huza-green-dark)]">
                Inspection note: {po.qualityNotes}
              </p>
            ) : null}

            {po.rejectionReason ? (
              <FarmerQualityReviewCard
                productName={po.productName}
                reason={po.rejectionReason}
                recommendation={
                  po.recommendation || defaultQualityRecommendation(po.rejectionReason)
                }
                resubmitHref="/farmer/approvals"
              />
            ) : null}

            {!po.paidAt && po.status !== "REJECTED" && po.status !== "CANCELLED" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/farmer/payments">
                  <Button size="sm" variant="ghost" className="gap-1">
                    Track payment <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/farmer/products">
                  <Button size="sm" variant="ghost">
                    Update supply
                  </Button>
                </Link>
              </div>
            ) : null}

            {po.paidAt ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--huza-green-dark)]">
                <PackageCheck className="h-4 w-4" />
                Paid {new Date(po.paidAt).toLocaleDateString()}
                {po.paymentRef ? ` · Ref ${po.paymentRef}` : ""}
              </p>
            ) : null}
          </FarmerPanel>
        ))}
      </div>
    </div>
  );
}
