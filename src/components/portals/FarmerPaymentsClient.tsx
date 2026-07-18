"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import type { FarmerPurchaseOrderRow } from "@/lib/farmer-workspace";
import { formatRwf, formatUnit } from "@/lib/utils";
import { ArrowRight, Wallet } from "lucide-react";

type Filter = "all" | "pending" | "paid";

function payoutAmount(po: FarmerPurchaseOrderRow) {
  if (po.dealType === "COMMISSION") {
    return po.farmerNetAmount ?? po.totalAmount;
  }
  return po.totalAmount;
}

/**
 * Phase 4 Payments — farmer payouts tied to Huza purchase orders.
 * Commission lines are read-only (settlement happens in Admin).
 */
export function FarmerPaymentsClient({ orders }: { orders: FarmerPurchaseOrderRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const payoutOrders = useMemo(
    () =>
      orders.filter(
        (po) => po.paidAt || !["DRAFT", "CANCELLED", "REJECTED"].includes(po.status)
      ),
    [orders]
  );

  const paid = payoutOrders.filter((po) => po.paidAt);
  const pending = payoutOrders.filter((po) => !po.paidAt);

  const paidTotal = paid.reduce((sum, po) => sum + payoutAmount(po), 0);
  const pendingTotal = pending.reduce((sum, po) => sum + payoutAmount(po), 0);

  const visible = useMemo(() => {
    if (filter === "paid") return paid;
    if (filter === "pending") return pending;
    return [...pending, ...paid];
  }, [filter, paid, pending]);

  if (payoutOrders.length === 0) {
    return (
      <FarmerPanel className="max-w-2xl">
        <Wallet className="h-8 w-8 text-[var(--huza-green)]" />
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
          No payouts yet
        </h2>
        <p className="mt-2 text-sm text-[var(--huza-muted)]">
          After Youth Huza accepts a purchase order, payment status and references show here.
        </p>
        <Link href="/farmer/orders" className="mt-4 inline-block">
          <Button className="gap-2">
            View purchase orders <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </FarmerPanel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <FarmerPanel className="!p-4 border-[var(--huza-green)]/30 bg-[var(--huza-mint)]/35">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            Paid to you
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--huza-green-dark)]">
            {formatRwf(paidTotal)}
          </p>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            {paid.length} paid purchase order{paid.length === 1 ? "" : "s"}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4 border-amber-200 bg-amber-50/60">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            Awaiting payment
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-amber-900">
            {formatRwf(pendingTotal)}
          </p>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            {pending.length} open payout{pending.length === 1 ? "" : "s"}
          </p>
        </FarmerPanel>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all" as const, label: "All", count: payoutOrders.length },
            { key: "pending" as const, label: "Awaiting", count: pending.length },
            { key: "paid" as const, label: "Paid", count: paid.length },
          ] as const
        ).map((f) => (
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

      <div className="space-y-3">
        {visible.map((po) => {
          const isPaid = Boolean(po.paidAt);
          const isCommission = po.dealType === "COMMISSION";
          const amount = payoutAmount(po);
          return (
            <FarmerPanel
              key={po.id}
              className={isPaid ? "border-[var(--huza-green)]/30" : "border-amber-200"}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-[var(--huza-green-dark)]">
                    {po.poNumber}
                  </p>
                  <h3 className="mt-0.5 font-semibold text-[var(--huza-ink)]">{po.productName}</h3>
                  <p className="mt-1 text-xs text-[var(--huza-muted)]">
                    {po.quantity.toLocaleString()} {formatUnit(po.unit)} · Order {po.status} ·{" "}
                    {isCommission ? "Commission sale" : "Outright buy"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
                    {formatRwf(amount)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isPaid
                        ? "bg-[var(--huza-mint)] text-[var(--huza-green-dark)]"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {isPaid ? "Paid" : "Awaiting payment"}
                  </span>
                </div>
              </div>

              {isCommission ? (
                <div className="mt-3 rounded-lg border border-[var(--huza-line)] bg-white px-3 py-2 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                    Commission breakdown
                  </p>
                  {po.saleAmount != null ? (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--huza-ink)]">
                      <li className="flex justify-between gap-3">
                        <span>Sale amount</span>
                        <strong>{formatRwf(po.saleAmount)}</strong>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span>HUZA commission ({po.commissionRate ?? 0}%)</span>
                        <strong>{formatRwf(po.commissionAmount ?? 0)}</strong>
                      </li>
                      <li className="flex justify-between gap-3 border-t border-[var(--huza-line)] pt-1">
                        <span>You receive</span>
                        <strong className="text-[var(--huza-green-dark)]">
                          {formatRwf(po.farmerNetAmount ?? amount)}
                        </strong>
                      </li>
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--huza-muted)]">
                      Youth Huza is selling this on HUZA FRESH. After sales, commission (
                      {po.commissionRate ?? 10}%) is deducted and your share is paid here.
                    </p>
                  )}
                </div>
              ) : null}

              {isPaid ? (
                <div className="mt-3 rounded-lg bg-[var(--huza-mint)]/40 px-3 py-2 text-sm">
                  <p className="font-medium text-[var(--huza-green-dark)]">
                    Paid {po.paidAt ? new Date(po.paidAt).toLocaleString() : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--huza-muted)]">
                    {po.paymentMethod ? `Method: ${po.paymentMethod}` : "Method: Youth Huza payout"}
                    {po.paymentRef ? ` · Ref: ${po.paymentRef}` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--huza-muted)]">
                  {isCommission
                    ? "Payment follows commission settlement in Admin after customer sales. Keep your MoMo / bank details current on My Profile."
                    : "Youth Huza will mark this paid after the purchase order is accepted and settled. Keep your registered payment details current on My Profile."}
                </p>
              )}

              <Link
                href="/farmer/orders"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
              >
                Open purchase orders <ArrowRight className="h-3 w-3" />
              </Link>
            </FarmerPanel>
          );
        })}
      </div>
    </div>
  );
}
