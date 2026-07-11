"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit, DELIVERY_FEES, DELIVERY_ZONE_LABELS, type DeliveryZoneKey } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cartFulfillmentEta, productFulfillmentLabel, ZONE_ETA_LABELS } from "@/lib/delivery-eta";

type DeliverySlot = "TODAY" | "TOMORROW" | "SCHEDULED";

export default function CartPage() {
  const { t } = useLocale();
  const { items, updateQty, removeItem, subtotal } = useCart();
  const [zone, setZone] = useState<DeliveryZoneKey>("KIGALI");
  const [slot, setSlot] = useState<DeliverySlot>("TODAY");
  const fee = DELIVERY_FEES[zone];
  const total = subtotal() + (items.length ? fee : 0);

  const fulfillment = useMemo(
    () => cartFulfillmentEta(items, zone, slot),
    [items, zone, slot]
  );

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
                <p className="mt-1 text-xs text-[var(--huza-muted)]">
                  {(() => {
                    const f = productFulfillmentLabel(item.stockQty);
                    return f.inStock
                      ? `${t("inStock")} · ${t("arrivesIn")} ${f.etaLabel}`
                      : `${t("preparingStock")} · ${t("arrivesIn")} ${f.etaLabel}`;
                  })()}
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
          <div className="mb-4 space-y-2">
            {(Object.keys(DELIVERY_FEES) as DeliveryZoneKey[]).map((z) => {
              const selected = zone === z;
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
                      : "border-[var(--huza-line)] hover:border-[var(--huza-green)]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{DELIVERY_ZONE_LABELS[z]}</span>
                    <span className="text-xs text-[var(--huza-muted)]">{formatRwf(DELIVERY_FEES[z])}</span>
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[var(--huza-green-dark)]">
                    ETA {ZONE_ETA_LABELS[z]}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="label">When do you want delivery?</label>
          <div className="mb-4 grid grid-cols-1 gap-2">
            {(
              [
                ["TODAY", "Today"],
                ["TOMORROW", "Tomorrow"],
                ["SCHEDULED", "Scheduled delivery"],
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
                <input
                  type="radio"
                  name="slot"
                  checked={slot === value}
                  onChange={() => setSlot(value)}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-[var(--huza-green-dark)]">
            {t("deliveryEta")}: {fulfillment.etaLabel}
          </p>
          {fulfillment.needsRestock && (
            <p className="mb-4 text-xs text-[var(--huza-muted)]">{t("restockEtaHint")}</p>
          )}
          {!fulfillment.needsRestock && (
            <p className="mb-4 text-xs text-[var(--huza-muted)]">
              {slot === "TODAY"
                ? `${t("inStockEtaHint")} ${fulfillment.etaLabel}`
                : `ETA: ${fulfillment.etaLabel}`}
            </p>
          )}

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
          <Link href={`/checkout?zone=${zone}&slot=${slot}`} className="block mt-4">
            <Button className="w-full">Proceed to checkout</Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
