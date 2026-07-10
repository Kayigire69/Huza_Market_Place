"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import {
  DELIVERY_FEES,
  DELIVERY_ZONE_LABELS,
  formatRwf,
  type DeliveryZoneKey,
} from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type PaymentSuccess = {
  orderNumber: string;
  orderId: string;
  total: number;
  paymentMessage: string;
  payerPhone: string;
  payeeName: string;
  payeePhone: string;
  method: string;
  paymentMode: "live" | "demo";
};

type PayPhase = "form" | "awaiting" | "paid" | "failed";

export default function CheckoutClient() {
  const { t } = useLocale();
  const { items, subtotal, clear } = useCart();
  const sp = useSearchParams();
  const initialZone = (sp.get("zone") as DeliveryZoneKey) || "KIGALI";
  const [zone, setZone] = useState<DeliveryZoneKey>(
    initialZone in DELIVERY_FEES ? initialZone : "KIGALI"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<PayPhase>("form");
  const [payment, setPayment] = useState<PaymentSuccess | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    gpsLat: "",
    gpsLng: "",
    instructions: "",
    paymentMethod: "MTN_MOMO",
    paymentPhone: "",
  });

  const fee = DELIVERY_FEES[zone];
  const cartSubtotal = subtotal();
  const total = useMemo(() => cartSubtotal + fee, [cartSubtotal, fee]);

  // Poll payment status while awaiting phone approval
  useEffect(() => {
    if (phase !== "awaiting" || !payment) return;

    const tick = async () => {
      const res = await fetch(`/api/payments/status?orderNumber=${payment.orderNumber}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.paymentStatus === "CONFIRMED" || data.paymentStatus === "VERIFIED") {
        setPhase("paid");
      } else if (data.paymentStatus === "FAILED") {
        setPhase("failed");
      }
    };

    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [phase, payment]);

  if (items.length === 0 && phase === "form") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p>{t("emptyCart")}</p>
        <Link href="/products" className="inline-block mt-4">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  if (phase === "awaiting" && payment) {
    const network = payment.method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--huza-mint)] animate-float">
          <Smartphone className="size-10 text-[var(--huza-green-dark)]" />
        </div>
        <h1 className="section-title">Approve payment on your phone</h1>
        <p className="mt-4 text-[var(--huza-muted)] leading-relaxed">
          A <strong>{network}</strong> payment request was sent to{" "}
          <strong>{payment.payerPhone}</strong>.
        </p>
        <div className="mt-6 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-left text-sm space-y-3">
          <p className="flex items-start gap-2">
            <Loader2 className="size-4 mt-0.5 animate-spin text-[var(--huza-green)] shrink-0" />
            <span>
              Open the pending approval on your phone and enter your PIN to confirm{" "}
              <strong>{formatRwf(payment.total)}</strong>.
            </span>
          </p>
          <p>
            Money goes <strong>directly to the seller</strong>: {payment.payeeName} (
            {payment.payeePhone}).
          </p>
          <p className="text-[var(--huza-muted)]">{payment.paymentMessage}</p>
          <p className="text-xs text-[var(--huza-muted)]">
            Order <strong>{payment.orderNumber}</strong>
            {payment.paymentMode === "demo" ? " · Demo mode (no live MoMo API keys yet)" : ""}
          </p>
        </div>

        {payment.paymentMode === "demo" && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={async () => {
                await fetch("/api/payments/status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderNumber: payment.orderNumber,
                    action: "confirm",
                  }),
                });
                setPhase("paid");
              }}
            >
              I approved on my phone
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await fetch("/api/payments/status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderNumber: payment.orderNumber,
                    action: "fail",
                  }),
                });
                setPhase("failed");
              }}
            >
              Decline / cancel
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-[var(--huza-muted)]">
          Waiting for confirmation… this page updates automatically.
        </p>
      </div>
    );
  }

  if (phase === "paid" && payment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto size-14 text-[var(--huza-green)]" />
        <h1 className="section-title mt-4">Payment confirmed!</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Order <strong>{payment.orderNumber}</strong> is paid.{" "}
          {formatRwf(payment.total)} was sent to <strong>{payment.payeeName}</strong>. Youth Huza
          will deliver directly — no middlemen.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/products">
            <Button>{t("continueShopping")}</Button>
          </Link>
          <Link href="/account">
            <Button variant="ghost">{t("account")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "failed" && payment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <XCircle className="mx-auto size-14 text-red-600" />
        <h1 className="section-title mt-4">Payment not completed</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          The approval on <strong>{payment.payerPhone}</strong> was declined or timed out. Order{" "}
          {payment.orderNumber} was cancelled and stock restored.
        </p>
        <Button className="mt-6" onClick={() => { setPhase("form"); setPayment(null); }}>
          Try again
        </Button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryZone: zone,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      clear();
      setPayment({
        orderNumber: data.orderNumber,
        orderId: data.id,
        total: data.total,
        paymentMessage: data.paymentMessage,
        payerPhone: data.payerPhone,
        payeeName: data.payeeName,
        payeePhone: data.payeePhone,
        method: data.method,
        paymentMode: data.paymentMode,
      });
      setPhase("awaiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="section-title mb-2">{t("guestCheckout")}</h1>
      <p className="text-sm text-[var(--huza-muted)] mb-8">
        After you place the order, you will get a <strong>payment approval prompt on your phone</strong>.
        Money goes directly to the seller&apos;s MoMo / Airtel number.
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-[var(--huza-line)] bg-white p-6"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t("fullName")}</label>
            <input
              required
              className="input-field"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t("phone")}</label>
            <input
              required
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="07xxxxxxxx"
            />
          </div>
        </div>
        <div>
          <label className="label">{t("address")}</label>
          <textarea
            required
            className="input-field min-h-20"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{t("deliveryZones")}</label>
          <select
            className="input-field"
            value={zone}
            onChange={(e) => setZone(e.target.value as DeliveryZoneKey)}
          >
            {(Object.keys(DELIVERY_FEES) as DeliveryZoneKey[]).map((z) => (
              <option key={z} value={z}>
                {DELIVERY_ZONE_LABELS[z]} — {formatRwf(DELIVERY_FEES[z])}
              </option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t("gpsOptional")} (lat)</label>
            <input
              className="input-field"
              value={form.gpsLat}
              onChange={(e) => setForm({ ...form, gpsLat: e.target.value })}
              placeholder="-1.9536"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="label">{t("gpsOptional")} (lng)</label>
            <input
              className="input-field"
              value={form.gpsLng}
              onChange={(e) => setForm({ ...form, gpsLng: e.target.value })}
              placeholder="30.0605"
              inputMode="decimal"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--huza-muted)] -mt-3">
          Optional map coordinates only. Put landmarks like “Sonatube” in delivery instructions below.
        </p>
        <div>
          <label className="label">{t("instructions")}</label>
          <textarea
            className="input-field min-h-16"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="e.g. Call me when you get to Sonatube"
          />
        </div>
        <div>
          <label className="label">{t("paymentMethod")}</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm">
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === "MTN_MOMO"}
                onChange={() => setForm({ ...form, paymentMethod: "MTN_MOMO" })}
              />
              {t("mtn")}
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm">
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === "AIRTEL_MONEY"}
                onChange={() => setForm({ ...form, paymentMethod: "AIRTEL_MONEY" })}
              />
              {t("airtel")}
            </label>
          </div>
        </div>
        <div>
          <label className="label">Phone that will receive the payment prompt</label>
          <input
            required
            className="input-field"
            value={form.paymentPhone}
            onChange={(e) => setForm({ ...form, paymentPhone: e.target.value })}
            placeholder="078xxxxxxx"
            inputMode="tel"
          />
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            This number gets the MoMo / Airtel “approve payment” message. Enter PIN on that phone to
            pay the seller directly.
          </p>
        </div>

        <div className="rounded-xl bg-[var(--huza-mint)] p-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span>{t("subtotal")}</span>
            <span>{formatRwf(subtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("deliveryFee")}</span>
            <span>{formatRwf(fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>{t("total")}</span>
            <span>{formatRwf(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending payment request..." : t("placeOrder")}
        </Button>
      </form>
    </div>
  );
}
