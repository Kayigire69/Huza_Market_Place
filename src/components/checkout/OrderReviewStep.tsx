"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Leaf,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit, cn } from "@/lib/utils";
import type { CartItem } from "@/lib/cart-store";

export type AppliedPromo = {
  code: string;
  title?: string | null;
  discountPct: number | null;
  discountAmt: number | null;
  freeDelivery: boolean;
};

type Props = {
  items: CartItem[];
  address: string;
  notes?: string;
  slot: "TODAY" | "TOMORROW";
  etaDayLabel: string;
  etaWindowLabel: string;
  zoneLabel: string;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethodLabel: string | null;
  appliedPromo: AppliedPromo | null;
  onSlotChange: (slot: "TODAY" | "TOMORROW") => void;
  onChangeAddress: () => void;
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onApplyPromo: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onClearPromo: () => void;
};

export function OrderReviewStep({
  items,
  address,
  notes,
  slot,
  etaDayLabel,
  etaWindowLabel,
  zoneLabel,
  deliveryFee,
  subtotal,
  discount,
  total,
  paymentMethodLabel,
  appliedPromo,
  onSlotChange,
  onChangeAddress,
  onUpdateQty,
  onRemove,
  onApplyPromo,
  onClearPromo,
}: Props) {
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [openProducts, setOpenProducts] = useState(true);
  const apply = async () => {
    setPromoError("");
    setPromoLoading(true);
    try {
      const res = await onApplyPromo(promoInput.trim());
      if (!res.ok) setPromoError(res.error || "Invalid code");
      else setPromoInput("");
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Products */}
      <div className="overflow-hidden rounded-xl border border-[var(--huza-line)] bg-white">
        <button
          type="button"
          onClick={() => setOpenProducts((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        >
          <span>Your items ({items.length})</span>
          <span className="text-xs font-medium text-[var(--huza-muted)]">
            {openProducts ? "Hide" : "Show · edit qty here"}
          </span>
        </button>
        {openProducts ? (
          <ul className="divide-y divide-[var(--huza-line)] border-t border-[var(--huza-line)]">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3 px-4 py-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[var(--huza-mint)]">
                  <Image
                    src={item.imageUrl || "/logo.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-[var(--huza-muted)]">
                    {formatRwf(item.price)} / {formatUnit(item.unit)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                      className="rounded-md border border-[var(--huza-line)] p-1.5"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                      className="rounded-md border border-[var(--huza-line)] p-1.5"
                      disabled={item.stockQty > 0 && item.quantity >= item.stockQty}
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => onRemove(item.productId)}
                      className="ml-auto rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {formatRwf(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Address */}
      <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
              Delivery address
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--huza-ink)]">
              {address.trim() || "No address confirmed yet"}
            </p>
            {notes ? (
              <p className="mt-1 text-xs text-[var(--huza-muted)]">Notes: {notes}</p>
            ) : null}
            <p className="mt-1 text-xs text-[var(--huza-muted)]">{zoneLabel}</p>
          </div>
          <button
            type="button"
            onClick={onChangeAddress}
            className="shrink-0 text-xs font-semibold text-[var(--huza-green-dark)] underline"
          >
            Change address
          </button>
        </div>
      </div>

      {/* Delivery day + auto fee/ETA */}
      <div className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
        <p className="text-sm font-semibold">When should we deliver?</p>
        <div className="flex gap-2">
          {(
            [
              ["TODAY", "Today"],
              ["TOMORROW", "Tomorrow"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onSlotChange(value)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-3 text-sm font-semibold",
                slot === value
                  ? "border-[var(--huza-green)] bg-[var(--huza-mint)] text-[var(--huza-green-dark)]"
                  : "border-[var(--huza-line)] bg-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--huza-cream,#F7FBF8)] p-4 text-sm">
          <div>
            <p className="text-xs text-[var(--huza-muted)]">Estimated arrival</p>
            <p className="font-semibold text-[var(--huza-green-dark)]">{etaDayLabel}</p>
            <p className="text-xs font-medium text-[var(--huza-ink)]">{etaWindowLabel}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--huza-muted)]">Delivery fee</p>
            <p className="font-semibold text-[var(--huza-green-dark)]">
              {deliveryFee === 0 ? "Free" : formatRwf(deliveryFee)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment preview */}
      <div className="rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
          Payment method
        </p>
        <p className="mt-1 font-medium">
          {paymentMethodLabel || "Choose your MoMo method on the next step"}
        </p>
      </div>

      {/* Promo */}
      <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4">
        <p className="text-sm font-semibold">Promotional code</p>
        {appliedPromo ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[var(--huza-mint)] px-3 py-2 text-sm">
            <span className="font-semibold text-[var(--huza-green-dark)]">
              {appliedPromo.code}
              {appliedPromo.title ? ` · ${appliedPromo.title}` : ""}
            </span>
            <button type="button" onClick={onClearPromo} className="text-xs font-semibold underline">
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="min-w-0 flex-1 rounded-xl border border-[var(--huza-line)] px-3 py-2.5 text-sm uppercase"
            />
            <Button
              type="button"
              variant="ghost"
              disabled={!promoInput.trim() || promoLoading}
              onClick={apply}
            >
              Apply
            </Button>
          </div>
        )}
        {promoError ? <p className="mt-2 text-xs text-red-600">{promoError}</p> : null}
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm">
        <p className="font-semibold">Order summary</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[var(--huza-muted)]">Subtotal</span>
            <span>{formatRwf(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--huza-muted)]">Delivery fee</span>
            <span>{deliveryFee === 0 ? "Free" : formatRwf(deliveryFee)}</span>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between text-[var(--huza-green-dark)]">
              <span>Discount</span>
              <span>-{formatRwf(discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-[var(--huza-line)] pt-2 text-base font-bold text-[var(--huza-green-dark)]">
            <span>Total</span>
            <span>{formatRwf(total)}</span>
          </div>
        </div>
      </div>

      <Link
        href="/cart"
        className="inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-[var(--huza-green-dark)] hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Cart
      </Link>

      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[var(--huza-muted)]"
        )}
      >
        <span className="inline-flex items-center gap-1">
          <Lock className="size-3" aria-hidden /> Secure checkout
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="size-3" aria-hidden /> Secure payment
        </span>
        <span className="inline-flex items-center gap-1">
          <Leaf className="size-3" aria-hidden /> Fresh delivery
        </span>
      </div>
    </div>
  );
}
