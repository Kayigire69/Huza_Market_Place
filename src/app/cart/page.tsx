"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit, DELIVERY_FEES, DELIVERY_ZONE_LABELS, type DeliveryZoneKey } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { t } = useLocale();
  const { items, updateQty, removeItem, subtotal } = useCart();
  const [zone, setZone] = useState<DeliveryZoneKey>("KIGALI");
  const fee = DELIVERY_FEES[zone];
  const total = subtotal() + (items.length ? fee : 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="section-title">{t("cart")}</h1>
        <p className="mt-4 text-[var(--huza-muted)]">{t("emptyCart")}</p>
        <Link href="/products" className="inline-block mt-6">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="section-title mb-8">{t("cart")}</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-2xl border border-[var(--huza-line)] bg-white p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--huza-mint)]">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="mt-1 font-bold text-[var(--huza-green-dark)]">
                  {formatRwf(item.price)} / {formatUnit(item.unit)}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="rounded border border-[var(--huza-line)] p-1"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="rounded border border-[var(--huza-line)] p-1"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="ml-auto text-red-700 p-1"
                    aria-label={t("remove")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Link href="/products">
            <Button variant="ghost">{t("continueShopping")}</Button>
          </Link>
        </div>

        <aside className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Summary</h2>
          <label className="label">{t("deliveryZones")}</label>
          <select
            className="input-field mb-4"
            value={zone}
            onChange={(e) => setZone(e.target.value as DeliveryZoneKey)}
          >
            {(Object.keys(DELIVERY_FEES) as DeliveryZoneKey[]).map((z) => (
              <option key={z} value={z}>
                {DELIVERY_ZONE_LABELS[z]} — {formatRwf(DELIVERY_FEES[z])}
              </option>
            ))}
          </select>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatRwf(subtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("deliveryFee")}</span>
              <span>{formatRwf(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--huza-line)] pt-2 font-bold text-base">
              <span>{t("total")}</span>
              <span>{formatRwf(total)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">{t("noMiddleman")}</p>
          <Link href={`/checkout?zone=${zone}`} className="block mt-4">
            <Button className="w-full">{t("checkout")}</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
