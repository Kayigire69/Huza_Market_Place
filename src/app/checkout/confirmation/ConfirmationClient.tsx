"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MapPin, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CheckoutHeader } from "@/components/checkout/CheckoutChrome";
import { formatRwf } from "@/lib/utils";

export type ConfirmationPayload = {
  orderNumber: string;
  payerPhone: string;
  total: number;
  estimatedDelivery?: string;
  deliveryAddress?: string;
  dayLabel?: string;
  windowLabel?: string;
  docAccessToken?: string;
  fulfillmentMethod?: "PICKUP" | "HOME_DELIVERY";
};

const STORAGE_KEY = "huza_order_confirmation";

export function loadConfirmation(orderNumber?: string | null): ConfirmationPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ConfirmationPayload;
    if (orderNumber && data.orderNumber !== orderNumber) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveConfirmation(payload: ConfirmationPayload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export default function ConfirmationClient({
  orderNumber: orderFromQuery,
}: {
  orderNumber?: string | null;
}) {
  const [data, setData] = useState<ConfirmationPayload | null>(null);

  useEffect(() => {
    setData(loadConfirmation(orderFromQuery));
  }, [orderFromQuery]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--huza-cream,#F7FBF8)]">
        <CheckoutHeader active="done" />
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="section-title">Order confirmation</h1>
          <p className="mt-3 text-sm text-[var(--huza-muted)]">
            We couldn’t find confirmation details for this session.
          </p>
          <Link href="/track" className="mt-6 inline-block">
            <Button>Track an order</Button>
          </Link>
        </div>
      </div>
    );
  }

  const etaDay = data.dayLabel;
  const etaWindow = data.windowLabel || data.estimatedDelivery;

  return (
    <div className="min-h-screen bg-[var(--huza-cream,#F7FBF8)]">
      <CheckoutHeader active="done" />
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--huza-mint)]">
            <CheckCircle2 className="size-9 text-[var(--huza-green)]" aria-hidden />
          </div>
          <p className="mt-4 text-2xl" aria-hidden>
            🎉
          </p>
          <h1 className="section-title mt-2">Order confirmed</h1>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            {data.fulfillmentMethod === "PICKUP"
              ? "Payment received. We will notify you when your order is ready for collection."
              : "Payment received. Our team will contact you to confirm delivery and the delivery fee."}
          </p>
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border-2 border-[var(--huza-green)] bg-white p-5 text-left shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
              Order number
            </p>
            <p className="mt-1 break-all font-mono text-xl font-bold text-[var(--huza-green-dark)] sm:text-2xl">
              {data.orderNumber}
            </p>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              Total paid · {formatRwf(data.total)}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--huza-green-dark)]">
              {data.fulfillmentMethod === "PICKUP" ? "Pickup Required" : "Delivery Required"}
            </p>
          </div>

          {(etaDay || etaWindow) && (
            <div className="border-t border-[var(--huza-line)] pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                {data.fulfillmentMethod === "PICKUP" ? "Collection" : "Delivery"}
              </p>
              {etaDay ? (
                <p className="mt-1 text-base font-semibold text-[var(--huza-ink)]">{etaDay}</p>
              ) : null}
              {etaWindow ? (
                <p className="text-sm font-medium text-[var(--huza-green-dark)]">{etaWindow}</p>
              ) : null}
            </div>
          )}

          {data.deliveryAddress ? (
            <div className="border-t border-[var(--huza-line)] pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                {data.fulfillmentMethod === "PICKUP" ? "Pickup location" : "Delivery address"}
              </p>
              <p className="mt-1 flex gap-2 text-sm text-[var(--huza-ink)]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" aria-hidden />
                <span>{data.deliveryAddress}</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/track?orderNumber=${encodeURIComponent(data.orderNumber)}&phone=${encodeURIComponent(data.payerPhone || "")}`}
            className="block"
          >
            <Button size="lg" className="w-full">
              <Package className="size-4" aria-hidden />
              Track Order
            </Button>
          </Link>
          <Link href="/products" className="block">
            <Button size="lg" variant="ghost" className="w-full">
              <ShoppingBag className="size-4" aria-hidden />
              Continue Shopping
            </Button>
          </Link>
          <a
            href={`/api/receipts/${encodeURIComponent(data.orderNumber)}?format=pdf${
              data.docAccessToken
                ? `&token=${encodeURIComponent(data.docAccessToken)}`
                : data.payerPhone
                  ? `&phone=${encodeURIComponent(data.payerPhone)}`
                  : ""
            }`}
            className="text-center text-sm font-semibold text-[var(--huza-green-dark)] underline"
          >
            Download receipt
          </a>
        </div>
      </div>
    </div>
  );
}
