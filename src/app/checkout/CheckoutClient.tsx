"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Crosshair,
  Loader2,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit, FLAT_DELIVERY_FEE_RWF, type DeliveryZoneDto } from "@/lib/utils";
import { cartFulfillmentEta, zoneFee } from "@/lib/delivery-eta";
import { Button } from "@/components/ui/Button";
import { DeliveryMapPin } from "@/components/checkout/DeliveryMapPin";
import { cn } from "@/lib/utils";

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

type CheckoutPhase = "form" | "awaiting" | "paid" | "failed";

type SavedAddress = {
  id: string;
  label: string;
  fullAddress: string;
  district: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
};

type SearchHit = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function CheckoutClient({
  zones,
  customer,
  savedAddresses = [],
}: {
  zones: DeliveryZoneDto[];
  customer?: { fullName: string; phone: string } | null;
  savedAddresses?: SavedAddress[];
}) {
  const { t } = useLocale();
  const { items, subtotal, clear } = useCart();
  const sp = useSearchParams();
  const defaultZone = zones[0]?.code || "KIGALI";
  const initialZone = sp.get("zone") || defaultZone;

  const [zone, setZone] = useState(
    zones.some((z) => z.code === initialZone) ? initialZone : defaultZone
  );
  const [slot, setSlot] = useState<"TODAY" | "TOMORROW">("TODAY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("form");
  const [payment, setPayment] = useState<PaymentSuccess | null>(null);
  const [copied, setCopied] = useState(false);
  const [locStatus, setLocStatus] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

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

  const fee = zoneFee(zone, zones);
  const cartSubtotal = subtotal();
  const total = useMemo(() => Math.max(0, cartSubtotal + fee), [cartSubtotal, fee]);
  const fulfillment = useMemo(
    () => cartFulfillmentEta(items, zone, slot, zones),
    [items, zone, slot, zones]
  );
  const zoneMeta = zones.find((z) => z.code === zone) || zones[0];
  const zoneLabel = zoneMeta?.labelEn || zone;

  const pinLat = form.gpsLat ? Number(form.gpsLat) : null;
  const pinLng = form.gpsLng ? Number(form.gpsLng) : null;

  const onPinMove = useCallback((lat: number, lng: number) => {
    setForm((f) => ({ ...f, gpsLat: String(lat), gpsLng: String(lng) }));
    setLocStatus("Drop-off pin updated.");
  }, []);

  const applyCoords = async (lat: number, lng: number, fillAddress: boolean) => {
    setForm((f) => ({
      ...f,
      gpsLat: String(lat),
      gpsLng: String(lng),
    }));
    if (!fillAddress) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.display_name) {
        setForm((f) => ({
          ...f,
          gpsLat: String(lat),
          gpsLng: String(lng),
          address: f.address.trim() ? f.address : data.display_name,
        }));
      }
    } catch {
      /* optional */
    }
  };

  const useLiveLocation = () => {
    setLocStatus("Getting your location…");
    setSearchHits([]);
    if (!navigator.geolocation) {
      setLocStatus("Location not supported. Search for your address or drop a pin on the map.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyCoords(pos.coords.latitude, pos.coords.longitude, true);
        setLocStatus("Current location found. Adjust the pin if needed.");
      },
      () => {
        setLocStatus(
          "Location access denied. Search your address or drop a pin on the map instead."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const searchAddress = async () => {
    const q = addressQuery.trim();
    if (q.length < 3) {
      setLocStatus("Type at least 3 characters to search.");
      return;
    }
    setSearching(true);
    setLocStatus("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=rw&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } }
      );
      const data = (await res.json()) as SearchHit[];
      setSearchHits(Array.isArray(data) ? data : []);
      if (!data?.length) setLocStatus("No matches. Try a road, landmark, or area name.");
    } catch {
      setLocStatus("Search failed. You can still type an address and place the pin.");
    } finally {
      setSearching(false);
    }
  };

  const pickSearchHit = async (hit: SearchHit) => {
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    setForm((f) => ({
      ...f,
      address: hit.display_name,
      gpsLat: String(lat),
      gpsLng: String(lng),
    }));
    setSearchHits([]);
    setAddressQuery("");
    setLocStatus("Address selected — refine the pin if needed.");
  };

  const pickSavedAddress = (a: SavedAddress) => {
    setForm((f) => ({
      ...f,
      address: a.fullAddress,
      gpsLat: a.gpsLat != null ? String(a.gpsLat) : f.gpsLat,
      gpsLng: a.gpsLng != null ? String(a.gpsLng) : f.gpsLng,
    }));
    setLocStatus(`Using saved location: ${a.label}`);
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

  const placeOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          instructions: form.instructions.trim() || undefined,
          deliveryZone: zone,
          deliverySlot: slot,
          paymentMethod: form.paymentMethod,
          paymentPhone: form.paymentPhone.trim() || form.phone.trim(),
          gpsLat: form.gpsLat || undefined,
          gpsLng: form.gpsLng || undefined,
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setError("Enter your full name.");
    if (!form.phone.trim()) return setError("Enter your phone number.");
    if (!form.address.trim()) return setError("Enter or select a delivery address.");
    if (!form.paymentPhone.trim()) return setError("Enter the Mobile Money phone number.");
    if (items.length === 0) return setError("Your cart is empty.");
    setError("");
    await placeOrder();
  };

  if (items.length === 0 && phase === "form") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p>{t("emptyCart")}</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  if (phase === "awaiting" && payment) {
    const network = payment.method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--huza-mint)]">
          <Smartphone className="size-10 text-[var(--huza-green-dark)]" />
        </div>
        <h1 className="section-title">Approve payment on your phone</h1>
        <p className="mt-4 leading-relaxed text-[var(--huza-muted)]">
          A <strong>{network}</strong> request was sent to <strong>{payment.payerPhone}</strong> for{" "}
          <strong>{formatRwf(payment.total)}</strong>.
        </p>
        <div className="mt-6 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-left text-sm">
          <p className="flex items-start gap-2">
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--huza-green)]" />
            Open the pending approval and enter your PIN.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--huza-mint)] px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--huza-muted)]">
                Order number
              </p>
              <p className="font-mono text-lg font-bold text-[var(--huza-green-dark)]">
                {payment.orderNumber}
              </p>
            </div>
            <Link href={`/track?orderNumber=${encodeURIComponent(payment.orderNumber)}`}>
              <Button size="sm">Track order</Button>
            </Link>
          </div>
          {payment.paymentMode === "demo" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={async () => {
                  await fetch("/api/payments/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderNumber: payment.orderNumber, action: "confirm" }),
                  });
                  setPhase("paid");
                }}
              >
                I approved on my phone
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  await fetch("/api/payments/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderNumber: payment.orderNumber, action: "fail" }),
                  });
                  setPhase("failed");
                }}
              >
                Decline / cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "paid" && payment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto size-14 text-[var(--huza-green)]" />
        <h1 className="section-title mt-4">Order confirmed</h1>
        <div className="mt-6 rounded-2xl border-2 border-[var(--huza-green)] bg-white p-5 text-left">
          <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)]">Order number</p>
          <p className="mt-1 break-all font-mono text-2xl font-bold text-[var(--huza-green-dark)]">
            {payment.orderNumber}
          </p>
          <p className="mt-3 text-sm">
            Payment status: <strong className="text-[var(--huza-green-dark)]">Paid</strong>
          </p>
          {payment.estimatedDelivery && (
            <p className="mt-1 text-sm font-semibold text-[var(--huza-green-dark)]">
              Estimated delivery: {payment.estimatedDelivery}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => copyOrderNumber(payment.orderNumber)}>
              {copied ? "Copied!" : "Copy order number"}
            </Button>
            <Link
              href={`/track?orderNumber=${encodeURIComponent(payment.orderNumber)}&phone=${encodeURIComponent(payment.payerPhone || form.phone || "")}`}
            >
              <Button size="sm">Track my order</Button>
            </Link>
            <a href={`/api/receipts/${encodeURIComponent(payment.orderNumber)}?format=pdf`}>
              <Button type="button" size="sm" variant="ghost">
                Download receipt
              </Button>
            </a>
          </div>
        </div>
        <Link href="/products" className="mt-6 inline-block">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  if (phase === "failed" && payment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <XCircle className="mx-auto size-14 text-red-600" />
        <h1 className="section-title mt-4">Payment not completed</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Approval on <strong>{payment.payerPhone}</strong> was declined or timed out.
        </p>
        <Button
          className="mt-6"
          onClick={() => {
            setPhase("form");
            setPayment(null);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-36 pt-8 sm:px-6 sm:pb-28 sm:pt-10">
      <h1 className="section-title text-[1.75rem]">Checkout</h1>
      <p className="mt-1 text-sm text-[var(--huza-muted)]">
        Confirm delivery and pay — usually under 2 minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        {/* 1. Customer */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--huza-ink)]">Your details</h2>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Full name</span>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base"
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Phone number</span>
            <input
              required
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  phone: e.target.value,
                  paymentPhone: f.paymentPhone === f.phone ? e.target.value : f.paymentPhone,
                }))
              }
              className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base"
              autoComplete="tel"
              inputMode="tel"
              placeholder="07X XXX XXXX"
            />
          </label>
        </section>

        {/* 2. Location */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--huza-ink)]">Delivery location</h2>

          {savedAddresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickSavedAddress(a)}
                  className="rounded-lg border border-[var(--huza-line)] bg-white px-3 py-2 text-left text-xs font-semibold hover:border-[var(--huza-green)]"
                >
                  <span className="block text-[var(--huza-green-dark)]">{a.label}</span>
                  <span className="line-clamp-1 text-[var(--huza-muted)]">{a.fullAddress}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={useLiveLocation}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-4 py-3.5 text-sm font-semibold text-white sm:w-auto"
          >
            <Crosshair className="size-4" />
            Use my current location
          </button>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--huza-muted)]" />
              <input
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchAddress();
                  }
                }}
                placeholder="Search road, building, landmark…"
                className="w-full rounded-xl border border-[var(--huza-line)] bg-white py-3 pl-10 pr-3 text-base"
              />
            </div>
            <Button type="button" variant="ghost" onClick={searchAddress} disabled={searching}>
              {searching ? <Loader2 className="size-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {searchHits.length > 0 && (
            <ul className="overflow-hidden rounded-xl border border-[var(--huza-line)] bg-white">
              {searchHits.map((hit) => (
                <li key={`${hit.lat}-${hit.lon}`}>
                  <button
                    type="button"
                    onClick={() => pickSearchHit(hit)}
                    className="w-full border-b border-[var(--huza-line)] px-3 py-2.5 text-left text-sm last:border-0 hover:bg-[var(--huza-mint)]"
                  >
                    {hit.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Delivery address</span>
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base"
              placeholder="Street, house, or landmark"
            />
          </label>

          <DeliveryMapPin lat={pinLat} lng={pinLng} onMove={onPinMove} />
          {locStatus && <p className="text-xs text-[var(--huza-muted)]">{locStatus}</p>}
        </section>

        {/* 3. Destination area (ETA differs; fee is flat) */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--huza-ink)]">Delivery area</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {zones.map((z) => (
              <button
                key={z.code}
                type="button"
                onClick={() => setZone(z.code)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition",
                  zone === z.code
                    ? "border-[var(--huza-green)] bg-[var(--huza-mint)] ring-2 ring-[var(--huza-green)]"
                    : "border-[var(--huza-line)] bg-white hover:border-[var(--huza-green)]"
                )}
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin className="size-3.5 text-[var(--huza-green)]" />
                  {z.labelEn}
                </p>
                <p className="mt-1 text-xs text-[var(--huza-muted)]">{z.etaLabelEn}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm">
            <div>
              <p className="text-xs text-[var(--huza-muted)]">Delivery fee</p>
              <p className="font-bold text-[var(--huza-green-dark)]">{formatRwf(fee)}</p>
              <p className="text-[10px] text-[var(--huza-muted)]">Same for all areas</p>
            </div>
            <div>
              <p className="text-xs text-[var(--huza-muted)]">Estimated delivery</p>
              <p className="font-bold text-[var(--huza-green-dark)]">{fulfillment.etaLabel}</p>
              <p className="text-[10px] text-[var(--huza-muted)]">{zoneLabel}</p>
            </div>
          </div>

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
                onClick={() => setSlot(value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold",
                  slot === value
                    ? "border-[var(--huza-green)] bg-[var(--huza-mint)] text-[var(--huza-green-dark)]"
                    : "border-[var(--huza-line)] bg-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 4. Instructions */}
        <section>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Delivery instructions <span className="font-normal text-[var(--huza-muted)]">(optional)</span>
            </span>
            <input
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base"
              placeholder="e.g. Call when arriving"
            />
          </label>
        </section>

        {/* 5. Order summary */}
        <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold">Order summary</h2>
          <ul className="mt-3 divide-y divide-[var(--huza-line)]">
            {items.map((item) => (
              <li key={item.productId} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--huza-muted)]">
                    {item.quantity} {formatUnit(item.unit)} · {formatRwf(item.price)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatRwf(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1.5 border-t border-[var(--huza-line)] pt-3 text-sm">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatRwf(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("deliveryFee")}</span>
              <span>{formatRwf(fee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[var(--huza-green-dark)]">
              <span>{t("total")}</span>
              <span>{formatRwf(total)}</span>
            </div>
          </div>
        </section>

        {/* 6. Payment */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Payment method</h2>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["MTN_MOMO", "MTN Mobile Money"],
                ["AIRTEL_MONEY", "Airtel Money"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, paymentMethod: value }))}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-semibold",
                  form.paymentMethod === value
                    ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
                    : "border-[var(--huza-line)] bg-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Mobile Money phone</span>
            <input
              required
              value={form.paymentPhone}
              onChange={(e) => setForm((f) => ({ ...f, paymentPhone: e.target.value }))}
              className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base"
              inputMode="tel"
              placeholder="Phone that will approve the payment"
            />
          </label>
          <p className="text-xs text-[var(--huza-muted)]">
            You will get a prompt on this phone. Payment goes to Youth Huza.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--huza-muted)]">
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3.5" /> Secure payment
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> Encrypted checkout
          </span>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {/* Desktop submit (mobile uses sticky bar) */}
        <div className="hidden sm:block">
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Processing…
              </>
            ) : (
              <>Pay {formatRwf(total)}</>
            )}
          </Button>
        </div>
      </form>

      {/* Sticky pay CTA — clears mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[var(--huza-line)] bg-[rgba(247,251,248,0.97)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--huza-muted)]">Total</p>
            <p className="truncate font-bold text-[var(--huza-green-dark)]">{formatRwf(total)}</p>
          </div>
          <Button
            type="button"
            size="lg"
            className="shrink-0 px-6"
            disabled={loading}
            onClick={() => {
              const fake = { preventDefault() {} } as FormEvent;
              onSubmit(fake);
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : `Pay ${formatRwf(total)}`}
          </Button>
        </div>
      </div>

      <p className="mt-4 hidden text-center text-[10px] text-[var(--huza-muted)] sm:block">
        Delivery {formatRwf(FLAT_DELIVERY_FEE_RWF)} to Kigali, Kamonyi & Bugesera
      </p>
    </div>
  );
}
