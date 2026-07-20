"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, DELIVERY_ZONE_LABELS, type DeliveryZoneKey } from "@/lib/utils";
import { Check } from "lucide-react";

type TrackData = {
  orderNumber: string;
  status: string;
  total: number;
  deliveryAddress: string;
  deliveryZone: string;
  createdAt: string;
  scheduledFor?: string | null;
  estimatedDelivery?: string | null;
  payment?: { status: string; method: string; payeeName?: string | null };
  delivery?: {
    status: string;
    estimatedMinutes?: number | null;
    deliveryPerson?: { fullName: string; phone: string } | null;
  };
  statusLog: { status: string; note: string | null; createdAt: string }[];
  items: { quantity: number; lineTotal: number; product: { nameEn: string } }[];
};

const STEPS: { code: string; label: string }[] = [
  { code: "PENDING", label: "Order received" },
  { code: "PAID", label: "Payment confirmed" },
  { code: "CONFIRMED", label: "Order confirmed" },
  { code: "PREPARING", label: "Preparing products" },
  { code: "PACKED", label: "Packed" },
  { code: "READY_FOR_DISPATCH", label: "Driver assigned" },
  { code: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { code: "DELIVERED", label: "Delivered" },
];

function resolveStepIndex(status: string) {
  if (status === "CANCELLED" || status === "REFUNDED" || status === "RETURNED") return -1;
  // Payment confirmed maps onto PAID visually when order jumps to CONFIRMED
  if (status === "CONFIRMED") return STEPS.findIndex((s) => s.code === "CONFIRMED");
  if (status === "READY_FOR_PICKUP") return STEPS.findIndex((s) => s.code === "READY_FOR_DISPATCH");
  const idx = STEPS.findIndex((s) => s.code === status);
  return Math.max(0, idx);
}

function TrackForm() {
  const sp = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(sp.get("orderNumber") ?? "");
  const [phone, setPhone] = useState(sp.get("phone") ?? "");
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const on = sp.get("orderNumber");
    const ph = sp.get("phone");
    if (on) setOrderNumber(on);
    if (ph) setPhone(ph);
  }, [sp]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    const res = await fetch(
      `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`
    );
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Order not found");
      return;
    }
    setData(json);
  };

  const stepIndex = data ? resolveStepIndex(data.status) : 0;
  const zoneLabel =
    DELIVERY_ZONE_LABELS[data?.deliveryZone as DeliveryZoneKey] || data?.deliveryZone;

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
      >
        <div>
          <label className="label">Order number</label>
          <input
            className="input-field"
            placeholder="e.g. HZ-2026-000245"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Phone used at checkout</label>
          <input
            className="input-field"
            placeholder="078xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Looking up…" : "Track order"}
        </Button>
      </form>

      {data && (
        <div className="mt-8 rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">Order number</p>
            <p className="font-mono text-xl font-bold text-[var(--huza-green-dark)]">{data.orderNumber}</p>
            <p className="text-sm text-[var(--huza-muted)] mt-1">
              {formatRwf(data.total)}
              {data.estimatedDelivery ? ` · ETA ${data.estimatedDelivery}` : ""}
            </p>
          </div>

          {data.status === "CANCELLED" ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              This order was cancelled.
            </p>
          ) : (
            <ol className="space-y-0">
              {STEPS.map((s, i) => {
                const done = stepIndex >= i;
                const current = stepIndex === i;
                return (
                  <li key={s.code} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-[var(--huza-green)] text-white"
                            : "bg-[var(--huza-mint)] text-[var(--huza-muted)]"
                        }`}
                      >
                        {done ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      {i < STEPS.length - 1 && (
                        <span
                          className={`w-0.5 flex-1 min-h-6 ${
                            stepIndex > i ? "bg-[var(--huza-green)]" : "bg-[var(--huza-line)]"
                          }`}
                        />
                      )}
                    </div>
                    <div className={`pb-5 ${current ? "pt-0.5" : "pt-1"}`}>
                      <p
                        className={`text-sm font-semibold ${
                          done ? "text-[var(--huza-green-dark)]" : "text-[var(--huza-muted)]"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="text-sm text-[var(--huza-muted)]">
            Deliver to: {data.deliveryAddress}
            {zoneLabel ? ` (${zoneLabel})` : ""}
          </p>
          {data.delivery?.deliveryPerson && (
            <p className="text-sm">
              Driver: {data.delivery.deliveryPerson.fullName} · {data.delivery.deliveryPerson.phone}
            </p>
          )}
          <ul className="text-sm space-y-1">
            {data.items.map((i, idx) => (
              <li key={idx}>
                {i.product.nameEn} × {i.quantity} · {formatRwf(i.lineTotal)}
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--huza-line)] pt-3 space-y-1">
            {data.statusLog.map((l, idx) => (
              <p key={idx} className="text-xs text-[var(--huza-muted)]">
                {new Date(l.createdAt).toLocaleString()} · {l.status}
                {l.note ? `: ${l.note}` : ""}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href={`/api/receipts/${data.orderNumber}?format=pdf&phone=${encodeURIComponent(phone.trim())}`}
              className="inline-block text-sm font-semibold text-[var(--huza-green-dark)]"
            >
              Download receipt ↓
            </a>
            <a
              href={`/api/invoices/${data.orderNumber}?format=pdf&phone=${encodeURIComponent(phone.trim())}`}
              className="inline-block text-sm font-semibold text-[var(--huza-green)]"
            >
              Download invoice ↓
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="section-title">Track your order</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Follow every step from order received to delivered. Use your order number and the phone you
        used at checkout.
      </p>
      <Suspense fallback={<p className="text-sm text-[var(--huza-muted)]">Loading…</p>}>
        <TrackForm />
      </Suspense>
    </div>
  );
}
