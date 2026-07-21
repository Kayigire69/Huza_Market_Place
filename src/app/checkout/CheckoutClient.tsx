"use client";

import {
  FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Loader2, MessageCircle, Smartphone, XCircle } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, type DeliveryZoneDto } from "@/lib/utils";
import { cartFulfillmentEta } from "@/lib/delivery-eta";
import { Button } from "@/components/ui/Button";
import {
  BackToCart,
  CheckoutHeader,
  CheckoutStepCard,
  type ProgressStep,
} from "@/components/checkout/CheckoutChrome";
import {
  DeliveryAddressStep,
  type ConfirmedDelivery,
} from "@/components/checkout/DeliveryAddressStep";
import {
  OrderReviewStep,
  type AppliedPromo,
} from "@/components/checkout/OrderReviewStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import {
  FulfillmentChoiceStep,
  type FulfillmentChoice,
} from "@/components/checkout/FulfillmentChoiceStep";
import type { PickupInfo } from "@/lib/pickup-info";
import { HOME_DELIVERY_FEE_NOTICE } from "@/lib/pickup-info";
import {
  CheckoutOrderSummary,
  type OrderSummaryTotals,
} from "@/components/checkout/CheckoutOrderSummary";
import { saveConfirmation } from "@/app/checkout/confirmation/ConfirmationClient";
import { formatMomoDisplay, isValidRwandaMomoPhone } from "@/lib/phone";
import {
  formatHuzaPayeeDisplay,
  LIVE_PAYMENT_TIMEOUT_MS,
  MANUAL_PAYMENT_TIMEOUT_MS,
} from "@/lib/payments/huza-payee";

type PaymentConfig = {
  payeeName: string;
  payeePhone: string;
  whatsappUrl: string;
  mtnLive: boolean;
  airtelLive: boolean;
};

type PaymentSuccess = {
  orderNumber: string;
  orderId: string;
  total: number;
  paymentMessage: string;
  payerPhone: string;
  payeeName: string;
  payeePhone: string;
  method: string;
  paymentMode: "live" | "manual" | "demo";
  fulfillmentMethod?: "PICKUP" | "HOME_DELIVERY";
  estimatedDelivery?: string;
  deliveryAddress?: string;
  dayLabel?: string;
  windowLabel?: string;
  totals: OrderSummaryTotals;
  docAccessToken?: string;
};

type CheckoutPhase = "form" | "awaiting" | "paid" | "failed" | "expired";

type SavedAddress = {
  id: string;
  label: string;
  fullAddress: string;
  district: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
};

function timeoutMsForMode(mode: PaymentSuccess["paymentMode"]) {
  return mode === "manual" ? MANUAL_PAYMENT_TIMEOUT_MS : LIVE_PAYMENT_TIMEOUT_MS;
}

export default function CheckoutClient({
  zones,
  customer,
  savedAddresses = [],
  paymentConfig,
  pickupInfo,
}: {
  zones: DeliveryZoneDto[];
  customer?: { fullName: string; phone: string } | null;
  savedAddresses?: SavedAddress[];
  paymentConfig: PaymentConfig;
  pickupInfo: PickupInfo;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { items, subtotal, clear, updateQty, removeItem } = useCart();
  const sp = useSearchParams();
  const defaultZone = zones[0]?.code || "KIGALI";
  const initialZone = sp.get("zone") || defaultZone;
  const slotParam = sp.get("slot");
  const initialSlot: "TODAY" | "TOMORROW" =
    slotParam === "TOMORROW" || slotParam === "SCHEDULED" ? "TOMORROW" : "TODAY";
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const addressSectionRef = useRef<HTMLDivElement>(null);
  const payLockRef = useRef(false);
  const [copiedPayee, setCopiedPayee] = useState(false);

  const [zone, setZone] = useState(
    zones.some((z) => z.code === initialZone) ? initialZone : defaultZone
  );
  const [slot, setSlot] = useState<"TODAY" | "TOMORROW">(initialSlot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("form");
  const [payment, setPayment] = useState<PaymentSuccess | null>(null);
  const [delivery, setDelivery] = useState<ConfirmedDelivery | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentChoice | null>(null);
  const [awaitStartedAt, setAwaitStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.floor(MANUAL_PAYMENT_TIMEOUT_MS / 1000)
  );

  const [form, setForm] = useState({
    fullName: customer?.fullName || "",
    phone: customer?.phone || "",
    address: "",
    instructions: "",
    paymentMethod: "MTN_MOMO" as "MTN_MOMO" | "AIRTEL_MONEY",
    paymentPhone: customer?.phone || "",
    gpsLat: "" as string,
    gpsLng: "" as string,
  });

  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      fullName: f.fullName || customer.fullName,
      phone: f.phone || customer.phone,
      paymentPhone: f.paymentPhone || customer.phone,
    }));
  }, [customer]);

  const baseFee = 0;
  const cartSubtotal = subtotal();
  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    let d = 0;
    if (appliedPromo.discountPct) d += Math.round((cartSubtotal * appliedPromo.discountPct) / 100);
    if (appliedPromo.discountAmt) d += appliedPromo.discountAmt;
    return Math.min(d, cartSubtotal);
  }, [appliedPromo, cartSubtotal]);
  const fee = 0;
  const total = useMemo(
    () => Math.max(0, cartSubtotal - discount + fee),
    [cartSubtotal, discount, fee]
  );
  const liveTotals: OrderSummaryTotals = useMemo(
    () => ({ subtotal: cartSubtotal, deliveryFee: fee, discount, total }),
    [cartSubtotal, fee, discount, total]
  );
  const fulfillment = useMemo(
    () => cartFulfillmentEta(items, zone, slot, zones),
    [items, zone, slot, zones]
  );
  const zoneMeta = zones.find((z) => z.code === zone) || zones[0];
  const zoneLabel = zoneMeta?.labelEn || zone;
  const manualPayIn =
    form.paymentMethod === "MTN_MOMO"
      ? !paymentConfig.mtnLive
      : !paymentConfig.airtelLive;

  const onDeliveryConfirm = (data: ConfirmedDelivery) => {
    setDelivery(data);
    setForm((f) => ({
      ...f,
      address: data.address,
      instructions: data.notes,
      gpsLat: data.gpsLat,
      gpsLng: data.gpsLng,
    }));
    if (data.zone && zones.some((z) => z.code === data.zone)) {
      setZone(data.zone);
    }
    setError("");
  };

  const onDeliveryClear = () => {
    setDelivery(null);
    setForm((f) => ({
      ...f,
      address: "",
      instructions: "",
      gpsLat: "",
      gpsLng: "",
    }));
  };

  const settledRef = useRef(false);

  const markPaid = (p: PaymentSuccess) => {
    if (settledRef.current) return;
    settledRef.current = true;
    saveConfirmation({
      orderNumber: p.orderNumber,
      payerPhone: p.payerPhone,
      total: p.total,
      estimatedDelivery: p.estimatedDelivery,
      deliveryAddress: p.deliveryAddress,
      dayLabel: p.dayLabel,
      windowLabel: p.windowLabel,
      docAccessToken: p.docAccessToken,
      fulfillmentMethod: p.fulfillmentMethod,
    });
    clear();
    router.push(`/checkout/confirmation?order=${encodeURIComponent(p.orderNumber)}`);
  };

  useEffect(() => {
    if (phase !== "awaiting" || !payment) return;
    const current = payment;
    const tick = async () => {
      const res = await fetch(`/api/payments/status?orderNumber=${current.orderNumber}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.paymentStatus === "CONFIRMED" || data.paymentStatus === "VERIFIED") {
        markPaid(current);
      } else if (data.paymentStatus === "FAILED") {
        settledRef.current = true;
        setPhase("failed");
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 3000);
    return () => clearInterval(id);
  }, [phase, payment]);

  useEffect(() => {
    if (phase !== "awaiting" || !awaitStartedAt || !payment) return;
    const orderNumber = payment.orderNumber;
    const timeoutMs = timeoutMsForMode(payment.paymentMode);
    const id = setInterval(() => {
      const left = Math.max(0, timeoutMs - (Date.now() - awaitStartedAt));
      setSecondsLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(id);
        if (settledRef.current) return;
        settledRef.current = true;
        setPhase("expired");
        void fetch("/api/payments/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber,
            action: "fail",
            phone: payment?.payerPhone,
          }),
        });
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase, awaitStartedAt, payment]);

  const payNow = async () => {
    if (payLockRef.current || loading) return;
    if (!fulfillmentMethod) {
      return setError("Choose pickup or home delivery first.");
    }
    if (fulfillmentMethod === "HOME_DELIVERY") {
      if (!delivery?.address.trim() || !form.address.trim()) {
        return setError("Confirm your delivery location first.");
      }
      if (delivery && !delivery.available) {
        return setError("Delivery is not available at this location.");
      }
    }
    if (!form.fullName.trim()) return setError("Enter your full name.");
    if (!form.phone.trim()) return setError("Enter your phone number.");
    if (!isValidRwandaMomoPhone(form.paymentPhone)) {
      return setError("Enter a valid MTN or Airtel Mobile Money number.");
    }
    if (items.length === 0) return setError("Your cart is empty.");

    payLockRef.current = true;
    setLoading(true);
    setError("");
    const frozenTotals = { ...liveTotals };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address:
            fulfillmentMethod === "PICKUP"
              ? undefined
              : form.address.trim(),
          fulfillmentMethod,
          instructions: form.instructions.trim() || undefined,
          deliveryZone: zone,
          deliverySlot: slot,
          paymentMethod: form.paymentMethod,
          paymentPhone: form.paymentPhone.trim(),
          promoCode: appliedPromo?.code || undefined,
          gpsLat: fulfillmentMethod === "HOME_DELIVERY" ? form.gpsLat || undefined : undefined,
          gpsLng: fulfillmentMethod === "HOME_DELIVERY" ? form.gpsLng || undefined : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment request failed");

      const success: PaymentSuccess = {
        orderNumber: data.orderNumber,
        orderId: data.id,
        total: data.total,
        paymentMessage: data.paymentMessage,
        payerPhone: data.payerPhone,
        payeeName: data.payeeName,
        payeePhone: data.payeePhone,
        method: data.method,
        paymentMode: data.paymentMode,
        fulfillmentMethod: data.fulfillmentMethod || fulfillmentMethod || undefined,
        estimatedDelivery: data.estimatedDelivery || fulfillment.etaLabel,
        deliveryAddress:
          fulfillmentMethod === "PICKUP"
            ? `${pickupInfo.locationName} — ${pickupInfo.address}`
            : form.address.trim(),
        dayLabel:
          fulfillmentMethod === "PICKUP" ? "We notify you when ready" : fulfillment.dayLabel,
        windowLabel: fulfillmentMethod === "PICKUP" ? "Free pickup" : fulfillment.windowLabel,
        totals: frozenTotals,
        docAccessToken: data.docAccessToken,
      };
      setPayment(success);
      setAwaitStartedAt(Date.now());
      setSecondsLeft(Math.floor(timeoutMsForMode(success.paymentMode) / 1000));

      if (data.paymentStatus === "CONFIRMED") {
        markPaid(success);
      } else {
        setPhase("awaiting");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment request failed");
      payLockRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const cancelPaymentWait = async () => {
    if (!payment) return;
    try {
      await fetch("/api/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: payment.orderNumber,
          action: "fail",
          phone: payment.payerPhone,
        }),
      });
    } catch {
      /* ignore */
    }
    setPhase("failed");
  };

  const resetToPayment = (changeMethod: boolean) => {
    payLockRef.current = false;
    settledRef.current = false;
    setPayment(null);
    setAwaitStartedAt(null);
    setPhase("form");
    setPaymentReady(true);
    setError("");
    if (changeMethod) {
      requestAnimationFrame(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const proceedToPayment = () => {
    if (!fulfillmentMethod) {
      setError("Choose pickup or home delivery first.");
      addressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (fulfillmentMethod === "HOME_DELIVERY") {
      if (!delivery?.address.trim()) {
        setError("Confirm your delivery location first.");
        addressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (delivery && !delivery.available) {
        setError("Delivery is not available at this location.");
        return;
      }
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setError("");
    setPaymentReady(true);
    requestAnimationFrame(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentReady) {
      proceedToPayment();
      return;
    }
    await payNow();
  };

  const summaryTotals = payment?.totals ?? liveTotals;

  const formProgress: ProgressStep = paymentReady ? "payment" : "checkout";

  const paymentLayout = (main: ReactNode, active: ProgressStep = "payment") => (
    <div className="min-h-screen bg-[var(--huza-cream,#F7FBF8)]">
      <CheckoutHeader active={active} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div>{main}</div>
        <aside className="mt-8 lg:mt-0 lg:sticky lg:top-4">
          <CheckoutOrderSummary totals={summaryTotals} compact />
          <p className="mt-3 text-center text-2xl font-bold text-[var(--huza-green-dark)] lg:text-left">
            {formatRwf(summaryTotals.total)}
          </p>
          <p className="text-center text-xs text-[var(--huza-muted)] lg:text-left">Total Amount</p>
        </aside>
      </div>
    </div>
  );

  if (items.length === 0 && phase === "form") {
    return (
      <div className="min-h-screen bg-[var(--huza-cream,#F7FBF8)]">
        <CheckoutHeader active="cart" />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p>{t("emptyCart")}</p>
          <Link href="/products" className="mt-4 inline-block">
            <Button>{t("continueShopping")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "awaiting" && payment) {
    const network = payment.method === "MTN_MOMO" ? "MTN Mobile Money" : "Airtel Money";
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const isManual = payment.paymentMode === "manual";
    const copyPayee = async () => {
      try {
        await navigator.clipboard.writeText(payment.payeePhone.replace(/\s/g, ""));
        setCopiedPayee(true);
        window.setTimeout(() => setCopiedPayee(false), 2000);
      } catch {
        /* ignore */
      }
    };
    return paymentLayout(
      <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--huza-mint)] lg:mx-0">
          <Smartphone className="size-10 text-[var(--huza-green-dark)]" />
        </div>
        <h1 className="section-title">
          {isManual ? "Send MoMo payment" : "Waiting for Payment..."}
        </h1>
        {isManual ? (
          <>
            <p className="mt-4 leading-relaxed text-[var(--huza-muted)]">
              Send exactly{" "}
              <strong className="text-[var(--huza-ink)]">{formatRwf(payment.total)}</strong> via{" "}
              <strong>{network}</strong> to:
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--huza-green)]/40 bg-white p-5 text-left">
              <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">
                Youth Huza payee
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--huza-green-dark)]">
                {payment.payeeName}
              </p>
              <p className="font-mono text-xl font-semibold text-[var(--huza-ink)]">
                {formatHuzaPayeeDisplay(payment.payeePhone)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => void copyPayee()}>
                  {copiedPayee ? (
                    <>
                      <Check className="size-3.5" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden /> Copy number
                    </>
                  )}
                </Button>
                {paymentConfig.whatsappUrl ? (
                  <a
                    href={paymentConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--huza-line)] bg-white px-3 text-xs font-semibold text-[var(--huza-green-dark)]"
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    WhatsApp / delivery help
                  </a>
                ) : null}
              </div>
              <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm text-[var(--huza-muted)]">
                <li>Open {network} → Send Money</li>
                <li>Paste the number above</li>
                <li>
                  Send <strong className="text-[var(--huza-ink)]">{formatRwf(payment.total)}</strong>
                </li>
                <li>
                  Put order{" "}
                  <strong className="font-mono text-[var(--huza-ink)]">{payment.orderNumber}</strong>{" "}
                  in the message
                </li>
              </ol>
            </div>
            <div className="mt-6 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-left text-sm">
              <p className="flex items-start gap-2">
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--huza-green)]" />
                Waiting for Huza to confirm… {mins}:{secs.toString().padStart(2, "0")} left
              </p>
              <p className="text-xs text-[var(--huza-muted)]">
                After you pay, keep this page open or track your order. Status updates when admin
                marks payment received.
              </p>
              <Link
                href={`/track?order=${encodeURIComponent(payment.orderNumber)}&phone=${encodeURIComponent(form.phone)}`}
                className="inline-flex text-sm font-semibold text-[var(--huza-green-dark)] underline"
              >
                Track order
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 leading-relaxed text-[var(--huza-muted)]">
              A payment request has been sent to
              <br />
              <strong className="text-[var(--huza-ink)]">{formatMomoDisplay(payment.payerPhone)}</strong>
            </p>
            <p className="mt-2 text-sm text-[var(--huza-muted)]">
              Please approve the <strong>{network}</strong> payment on your phone.
            </p>
            <div className="mt-6 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-left text-sm">
              <p className="flex items-start gap-2">
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--huza-green)]" />
                Waiting for approval… {mins}:{secs.toString().padStart(2, "0")} left
              </p>
              <div className="rounded-xl bg-[var(--huza-mint)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-[var(--huza-muted)]">
                  Order · Pending Payment
                </p>
                <p className="font-mono text-lg font-bold text-[var(--huza-green-dark)]">
                  {payment.orderNumber}
                </p>
              </div>
              <p className="text-xs text-[var(--huza-muted)]">
                We confirm payment automatically once {network} reports a successful approval. You do
                not need to tap anything here.
              </p>
            </div>
          </>
        )}
        <Button type="button" variant="ghost" className="mt-6" onClick={cancelPaymentWait}>
          Cancel
        </Button>
      </div>
    );
  }

  if ((phase === "failed" || phase === "expired") && payment) {
    return paymentLayout(
      <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
        <XCircle className="mx-auto size-14 text-red-600 lg:mx-0" />
        <h1 className="section-title mt-4">
          {phase === "expired" ? "Payment window expired" : "Payment Failed"}
        </h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          {phase === "expired"
            ? payment.paymentMode === "manual"
              ? "The payment window closed. Place a new order if you still want to pay by MoMo."
              : "Payment request expired. You can request a new payment prompt."
            : "The payment could not be completed."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
          <Button onClick={() => resetToPayment(false)}>Try Again</Button>
          <Button variant="ghost" onClick={() => resetToPayment(true)}>
            Change Payment Method
          </Button>
        </div>
      </div>
    );
  }

  const orderSummary = (
    <CheckoutOrderSummary
      items={items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        unit: i.unit,
      }))}
      totals={liveTotals}
      deliveryFeeLabel={
        fulfillmentMethod === "PICKUP"
          ? "Free"
          : fulfillmentMethod === "HOME_DELIVERY"
            ? "Confirmed by phone"
            : "—"
      }
      footer={
        // Desktop: Proceed lives here; Pay Now lives in PaymentStep (one primary CTA)
        !paymentReady ? (
          <div className="hidden lg:block">
            <Button type="button" size="lg" className="w-full" onClick={proceedToPayment}>
              Proceed to Payment
            </Button>
          </div>
        ) : null
      }
    />
  );

  return (
    <div className="min-h-screen bg-[var(--huza-cream,#F7FBF8)] pb-28 lg:pb-10">
      <CheckoutHeader active={formProgress} />

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <BackToCart />

        <form
          onSubmit={onSubmit}
          className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8"
        >
          <div className="space-y-4">
            <div ref={addressSectionRef}>
              <CheckoutStepCard step={1} title="Pickup or delivery">
                <FulfillmentChoiceStep
                  value={fulfillmentMethod}
                  pickup={pickupInfo}
                  onChange={(next) => {
                    setFulfillmentMethod(next);
                    setPaymentReady(false);
                    if (next === "PICKUP") {
                      onDeliveryClear();
                      setForm((f) => ({
                        ...f,
                        address: `${pickupInfo.locationName} — ${pickupInfo.address}`,
                        instructions: "",
                      }));
                    } else {
                      onDeliveryClear();
                    }
                    setError("");
                  }}
                />
              </CheckoutStepCard>
            </div>

            {fulfillmentMethod === "HOME_DELIVERY" ? (
              <div>
                <CheckoutStepCard step={2} title="Delivery address">
                  <DeliveryAddressStep
                    confirmed={delivery}
                    slot={slot}
                    onConfirm={onDeliveryConfirm}
                    onClear={onDeliveryClear}
                    canSaveAddress={Boolean(customer)}
                    savedAddresses={savedAddresses}
                  />
                </CheckoutStepCard>
              </div>
            ) : null}

            <div>
              <CheckoutStepCard
                step={fulfillmentMethod === "HOME_DELIVERY" ? 3 : 2}
                title="Order Review"
              >
                <OrderReviewStep
                  items={items}
                  address={
                    fulfillmentMethod === "PICKUP"
                      ? `${pickupInfo.locationName} — ${pickupInfo.address}`
                      : form.address
                  }
                  notes={form.instructions}
                  slot={slot}
                  etaDayLabel={
                    fulfillmentMethod === "PICKUP"
                      ? "We notify you when ready"
                      : fulfillment.dayLabel
                  }
                  etaWindowLabel={
                    fulfillmentMethod === "PICKUP" ? "Free pickup" : fulfillment.windowLabel
                  }
                  zoneLabel={
                    fulfillmentMethod === "PICKUP" ? "Youth Huza pickup" : zoneLabel
                  }
                  deliveryFee={0}
                  deliveryFeeLabel={
                    fulfillmentMethod === "PICKUP"
                      ? "Free"
                      : fulfillmentMethod === "HOME_DELIVERY"
                        ? "Confirmed by phone"
                        : "—"
                  }
                  fulfillmentLabel={
                    fulfillmentMethod === "PICKUP"
                      ? "Pickup from Youth Huza"
                      : fulfillmentMethod === "HOME_DELIVERY"
                        ? "Home delivery"
                        : null
                  }
                  deliveryNotice={
                    fulfillmentMethod === "HOME_DELIVERY" ? HOME_DELIVERY_FEE_NOTICE : null
                  }
                  hideSlot={fulfillmentMethod === "PICKUP"}
                  subtotal={cartSubtotal}
                  discount={discount}
                  total={total}
                  paymentMethodLabel={
                    paymentReady
                      ? `${form.paymentMethod === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"}${
                          form.paymentPhone ? ` · ${form.paymentPhone}` : ""
                        }`
                      : null
                  }
                  payHint={
                    manualPayIn
                      ? `Pay to ${paymentConfig.payeeName} · ${formatHuzaPayeeDisplay(paymentConfig.payeePhone)}`
                      : null
                  }
                  appliedPromo={appliedPromo}
                  onSlotChange={setSlot}
                  onChangeAddress={() => {
                    if (fulfillmentMethod === "PICKUP") {
                      setFulfillmentMethod(null);
                      return;
                    }
                    onDeliveryClear();
                    addressSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                  onApplyPromo={async (code) => {
                    try {
                      const res = await fetch("/api/promotions/validate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.valid) {
                        return { ok: false, error: data.error || "Invalid code" };
                      }
                      setAppliedPromo({
                        code: data.code,
                        title: data.title,
                        discountPct: data.discountPct,
                        discountAmt: data.discountAmt,
                        freeDelivery: Boolean(data.freeDelivery),
                      });
                      return { ok: true };
                    } catch {
                      return { ok: false, error: "Could not validate code" };
                    }
                  }}
                  onClearPromo={() => setAppliedPromo(null)}
                />
              </CheckoutStepCard>
            </div>

            <div ref={paymentSectionRef}>
              <CheckoutStepCard
                step={fulfillmentMethod === "HOME_DELIVERY" ? 4 : 3}
                title="Payment"
              >
                {!paymentReady ? (
                  <p className="text-sm text-[var(--huza-muted)]">
                    Review your order above, then tap <strong>Proceed to Payment</strong>.
                  </p>
                ) : (
                  <PaymentStep
                    method={form.paymentMethod}
                    paymentPhone={form.paymentPhone}
                    fullName={form.fullName}
                    contactPhone={form.phone}
                    total={total}
                    loading={loading}
                    manualPayIn={manualPayIn}
                    payeeName={paymentConfig.payeeName}
                    payeePhone={paymentConfig.payeePhone}
                    whatsappUrl={paymentConfig.whatsappUrl}
                    onMethodChange={(method) =>
                      setForm((f) => ({ ...f, paymentMethod: method }))
                    }
                    onPaymentPhoneChange={(paymentPhone) =>
                      setForm((f) => ({ ...f, paymentPhone }))
                    }
                    onFullNameChange={(fullName) => setForm((f) => ({ ...f, fullName }))}
                    onContactPhoneChange={(phone) =>
                      setForm((f) => ({
                        ...f,
                        phone,
                        paymentPhone:
                          !f.paymentPhone || f.paymentPhone === f.phone ? phone : f.paymentPhone,
                      }))
                    }
                    onPayNow={() => void payNow()}
                  />
                )}
              </CheckoutStepCard>
            </div>

            <div className="lg:hidden">{orderSummary}</div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
          </div>

          <aside className="hidden lg:sticky lg:top-4 lg:block">{orderSummary}</aside>
        </form>
      </div>

      {/* Mobile: single sticky primary CTA (Proceed or Pay Now) */}
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--huza-line)] bg-[rgba(247,251,248,0.97)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--huza-muted)]">Total Amount</p>
            <p className="truncate font-bold text-[var(--huza-green-dark)]">{formatRwf(total)}</p>
          </div>
          {paymentReady ? (
            <Button
              type="button"
              size="lg"
              className="shrink-0 px-6"
              disabled={loading || !isValidRwandaMomoPhone(form.paymentPhone)}
              onClick={() => void payNow()}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Pay Now"}
            </Button>
          ) : (
            <Button type="button" size="lg" className="shrink-0 px-6" onClick={proceedToPayment}>
              Proceed to Payment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
