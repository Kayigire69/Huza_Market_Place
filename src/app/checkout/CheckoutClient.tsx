"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import {
  formatRwf,
  formatUnit,
  type DeliveryZoneDto,
} from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Smartphone, CheckCircle2, XCircle, Loader2, FileText, CreditCard, MapPin } from "lucide-react";
import { cartFulfillmentEta, zoneFee } from "@/lib/delivery-eta";

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
  estimatedDelivery?: string;
};

type CheckoutPhase =
  | "delivery"
  | "invoice"
  | "payment"
  | "awaiting"
  | "paid"
  | "failed";

const STEPS = [
  { id: "delivery", label: "Delivery", icon: MapPin },
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "payment", label: "Payment", icon: CreditCard },
] as const;

export default function CheckoutClient({ zones }: { zones: DeliveryZoneDto[] }) {
  const { t } = useLocale();
  const { items, subtotal, clear } = useCart();
  const sp = useSearchParams();
  const defaultZone = zones[0]?.code || "KIGALI";
  const initialZone = sp.get("zone") || defaultZone;
  const initialSlot = (sp.get("slot") as "TODAY" | "TOMORROW" | "SCHEDULED") || "TODAY";
  const [zone, setZone] = useState(
    zones.some((z) => z.code === initialZone) ? initialZone : defaultZone
  );
  const [slot, setSlot] = useState<"TODAY" | "TOMORROW" | "SCHEDULED">(
    ["TODAY", "TOMORROW", "SCHEDULED"].includes(initialSlot) ? initialSlot : "TODAY"
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("delivery");
  const [payment, setPayment] = useState<PaymentSuccess | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    landmark: "",
    deliveryDistrict: "",
    deliverySector: "",
    deliveryCell: "",
    deliveryVillage: "",
    gpsLat: "",
    gpsLng: "",
    instructions: "",
    paymentMethod: "MTN_MOMO",
    paymentPhone: "",
  });

  const [locStatus, setLocStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoFreeDelivery, setPromoFreeDelivery] = useState(false);

  const fee = promoFreeDelivery ? 0 : zoneFee(zone, zones);
  const cartSubtotal = subtotal();
  const total = useMemo(
    () => Math.max(0, cartSubtotal - promoDiscount + fee),
    [cartSubtotal, promoDiscount, fee]
  );
  const fulfillment = useMemo(
    () => cartFulfillmentEta(items, zone, slot, zones),
    [items, zone, slot, zones]
  );
  const zoneMeta = zones.find((z) => z.code === zone) || zones[0];
  const zoneLabel = zoneMeta?.labelEn || zone;

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

  const validateDelivery = (): string | null => {
    if (!form.fullName.trim()) return "Enter your full name.";
    if (!form.phone.trim()) return "Enter your phone number.";
    if (!form.address.trim()) return "Enter your delivery address.";
    if (slot === "SCHEDULED" && !scheduledDate) return "Pick a scheduled delivery date.";
    return null;
  };

  const goToInvoice = (e: FormEvent) => {
    e.preventDefault();
    const err = validateDelivery();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setPhase("invoice");
  };

  const placeOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const addressWithLandmark = form.landmark.trim()
        ? `${form.address.trim()} (Landmark: ${form.landmark.trim()})`
        : form.address.trim();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          address: addressWithLandmark,
          deliveryZone: zone,
          deliverySlot: slot,
          scheduledFor: slot === "SCHEDULED" && scheduledDate ? scheduledDate : undefined,
          paymentPhone: form.paymentPhone,
          promoCode: promoCode || undefined,
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
        estimatedDelivery: data.estimatedDelivery,
      });
      setPhase(data.paymentStatus === "CONFIRMED" ? "paid" : "awaiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const onPay = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.paymentPhone.trim()) {
      setError("Enter the Mobile Money phone number.");
      return;
    }
    await placeOrder();
  };

  if (items.length === 0 && (phase === "delivery" || phase === "invoice" || phase === "payment")) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p>{t("emptyCart")}</p>
        <Link href="/products" className="inline-block mt-4">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  const stepIndex =
    phase === "delivery" ? 0 : phase === "invoice" ? 1 : phase === "payment" || phase === "awaiting" || phase === "paid" || phase === "failed" ? 2 : 0;

  const Stepper = () => (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === stepIndex;
        const done = i < stepIndex;
        return (
          <li key={s.id} className="flex items-center gap-2">
            {i > 0 && <span className="mx-1 text-[var(--huza-line)]">→</span>}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold ${
                active
                  ? "bg-[var(--huza-green)] text-white"
                  : done
                    ? "bg-[var(--huza-mint)] text-[var(--huza-green-dark)]"
                    : "bg-white text-[var(--huza-muted)] ring-1 ring-[var(--huza-line)]"
              }`}
            >
              <Icon className="size-3.5" />
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );

  if (phase === "awaiting" && payment) {
    const network = payment.method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Stepper />
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
        <h1 className="section-title mt-4">Payment successful</h1>
        <div className="mt-6 rounded-2xl border-2 border-[var(--huza-green)] bg-white p-5 text-left">
          <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">Order number</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--huza-green-dark)] break-all">
            {payment.orderNumber}
          </p>
          {payment.estimatedDelivery && (
            <p className="mt-3 text-sm font-semibold text-[var(--huza-green-dark)]">
              Estimated delivery: {payment.estimatedDelivery}
            </p>
          )}
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            Your receipt confirms payment. Track every step from received → delivered.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => copyOrderNumber(payment.orderNumber)}>
              {copied ? "Copied!" : "Copy order number"}
            </Button>
            <Link href={`/track?orderNumber=${encodeURIComponent(payment.orderNumber)}&phone=${encodeURIComponent(payment.payerPhone || form.phone || "")}`}>
              <Button size="sm">Track order</Button>
            </Link>
            <a href={`/api/receipts/${encodeURIComponent(payment.orderNumber)}?format=pdf`}>
              <Button type="button" size="sm">
                Download receipt
              </Button>
            </a>
            <a href={`/api/invoices/${encodeURIComponent(payment.orderNumber)}?format=pdf`}>
              <Button type="button" size="sm" variant="ghost">
                Download invoice
              </Button>
            </a>
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
        <Button
          className="mt-6"
          onClick={() => {
            setPhase("payment");
            setPayment(null);
          }}
        >
          Try payment again
        </Button>
      </div>
    );
  }

  if (phase === "invoice") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <Stepper />
        <h1 className="section-title mb-2">Invoice preview</h1>
        <p className="text-sm text-[var(--huza-muted)] mb-6">
          Review everything before you pay. You can still edit the order.
        </p>

        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--huza-line)] pb-4">
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-green-dark)]">
                HUZA FRESH
              </p>
              <p className="text-xs text-[var(--huza-muted)]">Powered by Youth Huza · Invoice</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-[var(--huza-green-dark)]">
                {zoneLabel}
              </p>
              <p className="text-[var(--huza-muted)]">ETA: {fulfillment.etaLabel}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            <p>
              <span className="text-[var(--huza-muted)]">Customer</span>
              <br />
              <strong>{form.fullName}</strong>
            </p>
            <p>
              <span className="text-[var(--huza-muted)]">Phone</span>
              <br />
              <strong>{form.phone}</strong>
            </p>
            <p className="sm:col-span-2">
              <span className="text-[var(--huza-muted)]">Delivery</span>
              <br />
              <strong>
                {form.address}
                {form.landmark ? ` · ${form.landmark}` : ""}
                {form.deliveryDistrict ? ` · ${form.deliveryDistrict}` : ""}
              </strong>
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--huza-line)] text-left text-[var(--huza-muted)]">
                  <th className="py-2 pr-2 font-medium">Product</th>
                  <th className="py-2 pr-2 font-medium">Qty</th>
                  <th className="py-2 pr-2 font-medium">Price</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId} className="border-b border-[var(--huza-line)]/60">
                    <td className="py-2.5 pr-2 font-medium">{item.name}</td>
                    <td className="py-2.5 pr-2">
                      {item.quantity} {formatUnit(item.unit)}
                    </td>
                    <td className="py-2.5 pr-2">{formatRwf(item.price)}</td>
                    <td className="py-2.5 text-right">{formatRwf(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatRwf(cartSubtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-[var(--huza-green-dark)]">
                <span>Discount</span>
                <span>-{formatRwf(promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>
                {t("deliveryFee")} ({zoneLabel})
              </span>
              <span>{formatRwf(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--huza-line)] pt-2 text-base font-bold">
              <span>{t("total")}</span>
              <span className="text-[var(--huza-green-dark)]">{formatRwf(total)}</span>
            </div>
            <p className="pt-2 text-sm font-semibold text-[var(--huza-green-dark)]">
              Estimated delivery: {fulfillment.etaLabel}
            </p>
          </div>
          </div>

        <div className="mt-5 rounded-xl border border-[var(--huza-line)] bg-white p-4">
          <label className="label">Promo / loyalty code</label>
          <div className="mt-1 flex gap-2">
            <input
              className="input-field"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                setPromoMsg("");
                if (!promoCode.trim()) {
                  setPromoDiscount(0);
                  setPromoFreeDelivery(false);
                  setPromoMsg("");
                  return;
                }
                const res = await fetch("/api/promotions/validate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code: promoCode }),
                });
                const data = await res.json();
                if (!res.ok || !data.valid) {
                  setPromoDiscount(0);
                  setPromoFreeDelivery(false);
                  setPromoMsg(data.error || "Invalid code");
                  return;
                }
                let discount = 0;
                if (data.discountPct) discount += Math.round((cartSubtotal * data.discountPct) / 100);
                if (data.discountAmt) discount += data.discountAmt;
                setPromoDiscount(Math.min(discount, cartSubtotal));
                setPromoFreeDelivery(Boolean(data.freeDelivery));
                setPromoMsg(data.title || "Code applied");
              }}
            >
              Apply
            </Button>
          </div>
          {promoMsg && (
            <p className="mt-2 text-xs text-[var(--huza-green-dark)]">{promoMsg}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="ghost" className="sm:flex-1" onClick={() => setPhase("delivery")}>
            Edit order
          </Button>
          <Button className="sm:flex-1" size="lg" onClick={() => setPhase("payment")}>
            Proceed to payment
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--huza-muted)]">
          Or{" "}
          <Link href="/cart" className="font-semibold text-[var(--huza-green-dark)] underline">
            go back to cart
          </Link>
        </p>
      </div>
    );
  }

  if (phase === "payment") {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-10">
        <Stepper />
        <h1 className="section-title mb-2">Payment</h1>
        <p className="text-sm text-[var(--huza-muted)] mb-6">
          Pay <strong>{formatRwf(total)}</strong> to Youth Huza via Mobile Money. Amount due matches
          your invoice.
        </p>

        <div className="mb-5 rounded-xl border border-[var(--huza-line)] bg-[var(--huza-mint)] px-4 py-3 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Amount due</span>
            <span>{formatRwf(total)}</span>
          </div>
          <p className="mt-1 text-[var(--huza-muted)]">
            {zoneLabel} · ETA {fulfillment.etaLabel}
          </p>
        </div>

        <form onSubmit={onPay} className="space-y-5 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
          <div>
            <label className="label">{t("paymentMethod")}</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm cursor-pointer has-[:checked]:border-[var(--huza-green)] has-[:checked]:bg-[var(--huza-mint)]">
                <input
                  type="radio"
                  name="pay"
                  checked={form.paymentMethod === "MTN_MOMO"}
                  onChange={() => setForm({ ...form, paymentMethod: "MTN_MOMO" })}
                />
                {t("mtn")}
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm cursor-pointer has-[:checked]:border-[var(--huza-green)] has-[:checked]:bg-[var(--huza-mint)]">
                <input
                  type="radio"
                  name="pay"
                  checked={form.paymentMethod === "AIRTEL_MONEY"}
                  onChange={() => setForm({ ...form, paymentMethod: "AIRTEL_MONEY" })}
                />
                {t("airtel")}
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-[var(--huza-line)] px-3 py-2 text-sm opacity-60">
                <input type="radio" name="pay" disabled />
                {t("cardComingSoon")}
              </label>
            </div>
          </div>
          <div>
            <label className="label">{t("paymentPhoneLabel")}</label>
            <input
              required
              className="input-field"
              value={form.paymentPhone}
              onChange={(e) => setForm({ ...form, paymentPhone: e.target.value })}
              placeholder="078xxxxxxx"
              inputMode="tel"
            />
            <p className="mt-1 text-xs text-[var(--huza-muted)]">{t("paymentPhoneHint")}</p>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="ghost" className="sm:flex-1" onClick={() => setPhase("invoice")}>
              Back to invoice
            </Button>
            <Button type="submit" className="sm:flex-1" size="lg" disabled={loading}>
              {loading ? "Sending payment request…" : "Pay now"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Delivery details step
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Stepper />
      <h1 className="section-title mb-2">Delivery details</h1>
      <p className="text-sm text-[var(--huza-muted)] mb-6">
        Choose where we deliver. Fee is <strong>{formatRwf(5000)}</strong> for all zones — arrival
        time updates when you pick a destination.
      </p>

      <form
        onSubmit={goToInvoice}
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
          <label className="label">Delivery destination</label>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {zones.map((z) => {
              const selected = zone === z.code;
              return (
                <button
                  key={z.code}
                  type="button"
                  onClick={() => setZone(z.code)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-[var(--huza-green)] bg-[var(--huza-mint)] ring-2 ring-[var(--huza-green)]/30"
                      : "border-[var(--huza-line)] hover:border-[var(--huza-green)]"
                  }`}
                >
                  <p className="font-semibold text-[var(--huza-green-dark)]">{z.labelEn}</p>
                  <p className="mt-1 text-xs text-[var(--huza-muted)]">
                    Fee {formatRwf(z.feeRwf)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[var(--huza-ink)]">{z.etaLabelEn}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl bg-[var(--huza-mint)] px-4 py-3 text-sm">
            <p className="font-semibold text-[var(--huza-green-dark)]">
              {zoneLabel} · {t("deliveryFee")} {formatRwf(fee)}
            </p>
            <p className="mt-0.5 text-[var(--huza-muted)]">
              Estimated delivery: <strong>{fulfillment.etaLabel}</strong>
              {fulfillment.needsRestock ? ` · ${t("restockEtaHint")}` : ""}
            </p>
          </div>
        </div>

        <div>
          <label className="label">Delivery address</label>
          <textarea
            required
            className="input-field min-h-20"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street, building, gate colour…"
          />
          <div className="mt-3">
            <label className="label">Landmark (optional)</label>
            <input
              className="input-field"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
              placeholder="e.g. Near the pharmacy / blue gate"
            />
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">District</label>
              <input
                className="input-field"
                value={form.deliveryDistrict}
                onChange={(e) => setForm({ ...form, deliveryDistrict: e.target.value })}
                placeholder="e.g. Kicukiro"
              />
            </div>
            <div>
              <label className="label">Sector</label>
              <input
                className="input-field"
                value={form.deliverySector}
                onChange={(e) => setForm({ ...form, deliverySector: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="label">Cell (optional)</label>
              <input
                className="input-field"
                value={form.deliveryCell}
                onChange={(e) => setForm({ ...form, deliveryCell: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Village (optional)</label>
              <input
                className="input-field"
                value={form.deliveryVillage}
                onChange={(e) => setForm({ ...form, deliveryVillage: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={useLiveLocation}>
              Use my live location (GPS)
            </Button>
            {form.gpsLat && form.gpsLng && (
              <span className="text-xs text-[var(--huza-green-dark)]">Location pinned ✓</span>
            )}
          </div>
          {locStatus && <p className="mt-1 text-xs text-[var(--huza-muted)]">{locStatus}</p>}
        </div>

        <div>
          <label className="label">When do you want delivery?</label>
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

        <div className="rounded-xl bg-[var(--huza-mint)] p-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span>{t("subtotal")}</span>
            <span>{formatRwf(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("deliveryFee")}</span>
            <span>{formatRwf(fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>{t("total")}</span>
            <span>{formatRwf(total)}</span>
          </div>
          <p className="pt-1 text-xs text-[var(--huza-muted)]">
            ETA for {zoneLabel}: {fulfillment.etaLabel}
          </p>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" className="w-full" size="lg">
          Continue to invoice
        </Button>
      </form>
    </div>
  );
}
