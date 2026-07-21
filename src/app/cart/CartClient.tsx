"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit, type DeliveryZoneDto } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cartFulfillmentEta, productFulfillmentLabel } from "@/lib/delivery-eta";

type DeliverySlot = "TODAY" | "TOMORROW" | "SCHEDULED";

export function CartClient({ zones }: { zones: DeliveryZoneDto[] }) {
  const { t } = useLocale();
  const { items, updateQty, removeItem, subtotal } = useCart();
  const defaultZone = zones[0]?.code || "KIGALI";
  const [zone, setZone] = useState(defaultZone);
  const [slot, setSlot] = useState<DeliverySlot>("TODAY");
  const total = subtotal();

  const fulfillment = useMemo(
    () => cartFulfillmentEta(items, zone, slot, zones),
    [items, zone, slot, zones]
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
    <div className="mx-auto max-w-5xl px-4 pb-40 pt-10 sm:px-6 md:pb-28 lg:pb-10">
      <h1 className="section-title mb-8">{t("cart")}</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4">
          {items.map((item) => {
            const f = productFulfillmentLabel(item.stockQty, 0, zone, zones);
            return (
              <div
                key={item.productId}
                className="flex gap-4 rounded-2xl border border-[var(--huza-line)] bg-white p-4"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--huza-mint)]">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="mt-1 font-bold text-[var(--huza-green-dark)]">
                    {formatRwf(item.price)} / {formatUnit(item.unit)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--huza-muted)]">
                    {f.inStock
                      ? `${f.stockLabel}${f.onlyNLeft ? ` · Only ${f.onlyNLeft} left` : ""}`
                      : `${f.stockLabel}`}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="rounded border border-[var(--huza-line)] p-1 transition hover:bg-[var(--huza-mint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--huza-green)]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="rounded border border-[var(--huza-line)] p-1 transition hover:bg-[var(--huza-mint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--huza-green)] disabled:opacity-40"
                      disabled={!f.inStock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto p-1 text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      aria-label={t("remove")}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <Link href="/products">
            <Button variant="ghost">{t("continueShopping")}</Button>
          </Link>
        </div>

        <aside className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 h-fit sticky top-24">
          <h2 className="font-semibold mb-4">Summary</h2>
          <label className="label">{t("deliveryZones")}</label>
          <div className="mb-4 space-y-2">
            {zones.map((z) => {
              const selected = zone === z.code;
              return (
                <button
                  key={z.code}
                  type="button"
                  onClick={() => setZone(z.code)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
                      : "border-[var(--huza-line)] hover:border-[var(--huza-green)]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{z.labelEn}</span>
                  </span>
                  <span className="mt-1 block text-xs text-[var(--huza-muted)]">
                    Area for timing estimate
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
          <p className="mb-4 text-xs text-[var(--huza-muted)]">
            {fulfillment.needsRestock
              ? t("restockEtaHint")
              : "Choose pickup (free) or home delivery at checkout. Delivery fees are confirmed by phone."}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-t border-[var(--huza-line)] pt-2 font-bold text-base">
              <span>{t("subtotal")}</span>
              <span>{formatRwf(total)}</span>
            </div>
            <p className="text-xs font-normal text-[var(--huza-muted)]">
              Product total only — delivery options at checkout.
            </p>
          </div>

          <Link href={`/checkout?zone=${zone}&slot=${slot}`} className="mt-4 block">
            <Button className="w-full" size="lg">
              Proceed to checkout
            </Button>
          </Link>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">{t("noMiddleman")}</p>
        </aside>
      </div>

      {/* Mobile/tablet: sticky checkout CTA (sits above bottom nav on phones) */}
      <div className="fixed inset-x-0 bottom-[4.75rem] z-[60] border-t border-[var(--huza-line)] bg-white/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--huza-muted)]">{t("total")}</p>
            <p className="truncate font-bold text-[var(--huza-green-dark)]">{formatRwf(total)}</p>
          </div>
          <Link href={`/checkout?zone=${zone}&slot=${slot}`} className="shrink-0">
            <Button size="lg">Proceed to checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
