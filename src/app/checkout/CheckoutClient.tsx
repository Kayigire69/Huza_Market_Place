"use client";

import { FormEvent, useMemo, useState } from "react";
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
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);
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

  if (items.length === 0 && !success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p>{t("emptyCart")}</p>
        <Link href="/products" className="inline-block mt-4">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="section-title">Order placed!</h1>
        <p className="mt-4 text-[var(--huza-muted)]">
          Your order <strong>{success.orderNumber}</strong> is confirmed. Youth Huza will deliver
          directly — no middlemen.
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
      setSuccess({ orderNumber: data.orderNumber });
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
        No account required. Or{" "}
        <Link href="/auth/login" className="text-[var(--huza-green)] font-semibold">
          {t("login")}
        </Link>{" "}
        to save addresses and reorder.
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
            />
          </div>
          <div>
            <label className="label">{t("gpsOptional")} (lng)</label>
            <input
              className="input-field"
              value={form.gpsLng}
              onChange={(e) => setForm({ ...form, gpsLng: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">{t("instructions")}</label>
          <textarea
            className="input-field min-h-16"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
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
          <label className="label">MoMo / Airtel phone</label>
          <input
            required
            className="input-field"
            value={form.paymentPhone}
            onChange={(e) => setForm({ ...form, paymentPhone: e.target.value })}
          />
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
          {loading ? "Processing..." : t("placeOrder")}
        </Button>
      </form>
    </div>
  );
}
