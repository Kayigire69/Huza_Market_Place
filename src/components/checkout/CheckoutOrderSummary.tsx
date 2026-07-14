"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { formatRwf, formatUnit } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type SummaryLine = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
};

export type OrderSummaryTotals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

type Props = {
  items?: SummaryLine[];
  totals: OrderSummaryTotals;
  footer?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function CheckoutOrderSummary({
  items,
  totals,
  footer,
  className,
  compact,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--huza-line)] bg-white p-4 sm:p-5",
        className
      )}
    >
      <h2 className="text-base font-semibold text-[var(--huza-ink)]">Order Summary</h2>
      {items && items.length > 0 && !compact ? (
        <ul className="mt-3 divide-y divide-[var(--huza-line)]">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex items-start justify-between gap-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-[var(--huza-muted)]">
                  ×{item.quantity} · {formatRwf(item.price)} / {formatUnit(item.unit)}
                </p>
              </div>
              <p className="shrink-0 font-semibold">{formatRwf(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <div
        className={cn(
          "space-y-1.5 text-sm",
          items && items.length > 0 && !compact
            ? "mt-3 border-t border-[var(--huza-line)] pt-3"
            : "mt-3"
        )}
      >
        <div className="flex justify-between">
          <span className="text-[var(--huza-muted)]">Subtotal</span>
          <span>{formatRwf(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--huza-muted)]">Delivery Fee</span>
          <span>{totals.deliveryFee === 0 ? "Free" : formatRwf(totals.deliveryFee)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between text-[var(--huza-green-dark)]">
            <span>Discount</span>
            <span>-{formatRwf(totals.discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-bold text-[var(--huza-green-dark)]">
          <span>Total Amount</span>
          <span>{formatRwf(totals.total)}</span>
        </div>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
      <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-[var(--huza-muted)]">
        <Lock className="size-3" aria-hidden />
        Secure payments powered by MTN Mobile Money and Airtel Money.
      </p>
    </div>
  );
}
