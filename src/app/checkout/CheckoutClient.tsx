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
  const initialSlot = (sp.get("slot") as "TODAY" | "TOMORROW" | "SCHEDULED") || "TODAY";
  const [zone, setZone] = useState<DeliveryZoneKey>(
    initialZone in DELIVERY_FEES ? initialZone : "KIGALI"
  );
  const [slot, setSlot] = useState<"TODAY" | "TOMORROW" | "SCHEDULED">(
    ["TODAY", "TOMORROW", "SCHEDULED"].includes(initialSlot) ? initialSlot : "TODAY"
  );
  const [scheduledDate, setScheduledDate] = useState("");
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

  const isCod = form.paymentMethod === "CASH_ON_DELIVERY";
  const fee = DELIVERY_FEES[zone];
  const cartSubtotal = subtotal();
  const total = useMemo(() => cartSubtotal + fee, [cartSubtotal, fee]);
  const [locStatus, setLocStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const useLiveLocation = () => {
    setLocStatus("Getting your location…");
    if (!navigator.geolocation) {
      setLocStatus("Location not supported on this device. Please type your address.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({ ...f, gpsLat: String(lat), gpsLng: String(lng) }));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } }
          );
          if (res.ok) {
            const data = await res.json();
            const label = data.display_name as string | undefined;
            if (label) {
              setForm((f) => ({
                ...f,
                gpsLat: String(lat),
                gpsLng: String(lng),
                address: f.address?.trim() ? f.address : label,
              }));
              setLocStatus("Live location captured. You can edit the address if needed.");
              return;
            }
          }
        } catch {
          /* ignore reverse-geocode failures */
        }
        setLocStatus(
          `Live location saved (${lat.toFixed(5)}, ${lng.toFixed(5)}). Please type your street / landmark in the address field.`
        );
      },
      () => {
        setLocStatus("Could not get location. Allow location access or type your address.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const copyOrderNumber = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // Poll payment status while awaiting phone approval
  useEffect(() => {
    if (phase !== "awaiting" || !payment || isCod) return;

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
  }, [phase, payment, isCod]);

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
            You are paying <strong>Youth Huza</strong> ({payment.payeeName}). Huza sells and delivers
            your order.
          </p>
          <p className="text-xs text-[var(--huza-muted)]">
            Save your order number to track delivery
          </p>
          <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--huza-muted)]">Order number</p>
              <p className="font-mono text-lg font-bold text-[var(--huza-green-dark)]">
                {payment.orderNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" type="button" onClick={() => copyOrderNumber(payment.orderNumber)}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Link href={`/track?orderNumber=${encodeURIComponent(payment.orderNumber)}`}>
                <Button size="sm">Track order</Button>
              </Link>
            </div>
          </div>
          <p className="text-[var(--huza-muted)]">{payment.paymentMessage}</p>
          <p className="text-xs text-[var(--huza-muted)]">
            {payment.paymentMode === "demo" ? "Demo mode (no live MoMo API keys yet)" : ""}
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
        <h1 className="section-title mt-4">
          {payment.method === "CASH_ON_DELIVERY" ? "Order confirmed!" : "Payment confirmed!"}
        </h1>
        <div className="mt-6 rounded-2xl border-2 border-[var(--huza-green)] bg-white p-5 text-left">
          <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">Your order number</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--huza-green-dark)] break-all">
            {payment.orderNumber}
          </p>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            Save this number — use it with your phone on Track Order to follow delivery.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => copyOrderNumber(payment.orderNumber)}>
              {copied ? "Copied!" : "Copy order number"}
            </Button>
            <Link href={`/track?orderNumber=${encodeURIComponent(payment.orderNumber)}&phone=${encodeURIComponent(payment.payerPhone || "")}`}>
              <Button size="sm">Track this order</Button>
            </Link>
          </div>
        </div>
        <p className="mt-4 text-[var(--huza-muted)]">
          {formatRwf(payment.total)} · Youth Huza will prepare and deliver your order.
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
          deliverySlot: slot,
          scheduledFor: slot === "SCHEDULED" && scheduledDate ? scheduledDate : undefined,
          paymentPhone: isCod ? form.phone : form.paymentPhone,
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
      setPhase(data.method === "CASH_ON_DELIVERY" || data.paymentStatus === "CONFIRMED" ? "paid" : "awaiting");
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
        After you place the order, approve payment on your phone. You pay{" "}
        <strong>Youth Huza (HUZA MARKETPLACE)</strong> — we sell and deliver the products.
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
          <label className="label">Delivery location</label>
          <textarea
            required
            className="input-field min-h-20"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street, sector, landmark (e.g. near Sonatube)"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={useLiveLocation}>
              Use my live location
            </Button>
            {form.gpsLat && form.gpsLng && (
              <span className="text-xs text-[var(--huza-green-dark)]">
                Location pinned ✓
              </span>
            )}
          </div>
          {locStatus && <p className="mt-1 text-xs text-[var(--huza-muted)]">{locStatus}</p>}
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
        <div>
          <label className="label">Estimated delivery</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(
              [
                ["TODAY", "Today"],
                ["TOMORROW", "Tomorrow"],
                ["SCHEDULED", "Scheduled"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                  slot === value
                    ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
                    : "border-[var(--huza-line)]"
                }`}
              >
                <input type="radio" checked={slot === value} onChange={() => setSlot(value)} />
                {label}
              </label>
            ))}
          </div>
          {slot === "SCHEDULED" && (
            <input
              type="datetime-local"
              className="input-field"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          )}
        </div>
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
            <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm">
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === "CASH_ON_DELIVERY"}
                onChange={() => setForm({ ...form, paymentMethod: "CASH_ON_DELIVERY" })}
              />
              Cash on delivery
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm opacity-60">
              <input type="radio" name="pay" disabled />
              Card (coming soon)
            </label>
          </div>
        </div>
        {!isCod && (
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
              Enter the phone that will approve MoMo/Airtel. Payment goes to Youth Huza.
            </p>
          </div>
        )}
        {isCod && (
          <p className="text-sm text-[var(--huza-muted)] rounded-lg bg-[var(--huza-mint)] p-3">
            You will pay the delivery rider in cash when your order arrives.
          </p>
        )}

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
          {loading
            ? isCod
              ? "Placing order..."
              : "Sending payment request..."
            : t("placeOrder")}
        </Button>
      </form>
    </div>
  );
}
