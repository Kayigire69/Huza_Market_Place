"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";

type TrackData = {
  orderNumber: string;
  status: string;
  total: number;
  deliveryAddress: string;
  deliveryZone: string;
  createdAt: string;
  scheduledFor?: string | null;
  payment?: { status: string; method: string; payeeName?: string | null };
  delivery?: {
    status: string;
    estimatedMinutes?: number | null;
    deliveryPerson?: { fullName: string; phone: string } | null;
  };
  statusLog: { status: string; note: string | null; createdAt: string }[];
  items: { quantity: number; lineTotal: number; product: { nameEn: string } }[];
};

const STEPS = [
  "PENDING",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "PACKED",
  "READY_FOR_DISPATCH",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

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

  const stepIndex = data
    ? data.status === "CANCELLED"
      ? -1
      : Math.max(0, STEPS.indexOf(data.status))
    : 0;

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
            placeholder="e.g. HUZA-123456"
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
        <div className="mt-8 rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">Order number</p>
            <p className="font-mono text-xl font-bold text-[var(--huza-green-dark)]">{data.orderNumber}</p>
            <p className="text-sm text-[var(--huza-muted)] mt-1">
              Status: <strong>{data.status}</strong> · {formatRwf(data.total)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  stepIndex >= i
                    ? "bg-[var(--huza-green)] text-white"
                    : "bg-[var(--huza-mint)] text-[var(--huza-muted)]"
                }`}
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <p className="text-sm text-[var(--huza-muted)]">
            Deliver to: {data.deliveryAddress} ({data.deliveryZone})
          </p>
          {data.delivery?.deliveryPerson && (
            <p className="text-sm">
              Driver: {data.delivery.deliveryPerson.fullName} · {data.delivery.deliveryPerson.phone}
            </p>
          )}
          <ul className="text-sm space-y-1">
            {data.items.map((i, idx) => (
              <li key={idx}>
                {i.product.nameEn} × {i.quantity} — {formatRwf(i.lineTotal)}
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--huza-line)] pt-3 space-y-1">
            {data.statusLog.map((l, idx) => (
              <p key={idx} className="text-xs text-[var(--huza-muted)]">
                {new Date(l.createdAt).toLocaleString()} — {l.status}
                {l.note ? `: ${l.note}` : ""}
              </p>
            ))}
          </div>
          <Link
            href={`/api/invoices/${data.orderNumber}`}
            className="inline-block text-sm font-semibold text-[var(--huza-green)]"
            target="_blank"
          >
            Download invoice →
          </Link>
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
        Use the order number shown after checkout (and in My Account) plus the phone you used when
        ordering.
      </p>
      <Suspense fallback={<p className="text-sm text-[var(--huza-muted)]">Loading…</p>}>
        <TrackForm />
      </Suspense>
    </div>
  );
}
