"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="section-title">Track your order</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Enter your order number and phone to see live delivery status from Youth Huza.
      </p>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
      >
        <input
          className="input-field"
          placeholder="Order number (e.g. HUZA-123456)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder="Phone used at checkout"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Track order"}
        </Button>
      </form>

      {data && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-lg">{data.orderNumber}</p>
                <p className="text-sm text-[var(--huza-muted)]">
                  {formatRwf(data.total)} · {data.deliveryZone}
                </p>
              </div>
              <span className="rounded-full bg-[var(--huza-mint)] px-3 py-1 text-xs font-semibold h-fit">
                {data.status}
              </span>
            </div>
            <p className="mt-3 text-sm">{data.deliveryAddress}</p>

            {data.status !== "CANCELLED" && (
              <ol className="mt-6 space-y-2">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i <= stepIndex
                          ? "bg-[var(--huza-green)] text-white"
                          : "bg-[var(--huza-line)] text-[var(--huza-muted)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={i <= stepIndex ? "font-semibold" : "text-[var(--huza-muted)]"}>
                      {s.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <ul className="mt-4 text-sm text-[var(--huza-muted)] space-y-1">
              {data.items.map((i, idx) => (
                <li key={idx}>
                  {i.product.nameEn} × {i.quantity} — {formatRwf(i.lineTotal)}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`/api/invoices/${data.orderNumber}`} target="_blank" rel="noreferrer">
                <Button size="sm">Download invoice (PDF)</Button>
              </a>
              <Link href="/support">
                <Button size="sm" variant="ghost">
                  Need help?
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Status history</h2>
            <ul className="space-y-2 text-sm">
              {data.statusLog.map((l, i) => (
                <li key={i} className="border-b border-[var(--huza-line)] pb-2">
                  <strong>{l.status}</strong> — {l.note || ""}
                  <span className="block text-xs text-[var(--huza-muted)]">
                    {new Date(l.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
