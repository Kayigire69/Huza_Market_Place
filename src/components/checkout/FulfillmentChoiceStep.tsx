"use client";

import { MapPin, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PickupInfo } from "@/lib/pickup-info";
import { HOME_DELIVERY_FEE_NOTICE } from "@/lib/pickup-info";
import { whatsappPresetUrl } from "@/lib/brand-contact";

export type FulfillmentChoice = "PICKUP" | "HOME_DELIVERY";

type Props = {
  value: FulfillmentChoice | null;
  onChange: (value: FulfillmentChoice) => void;
  pickup: PickupInfo;
};

export function FulfillmentChoiceStep({ value, onChange, pickup }: Props) {
  const pickupWa = whatsappPresetUrl("orderSupport", pickup.whatsappUrl);
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--huza-muted)]">
        Choose how you want to receive your order.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("PICKUP")}
          className={cn(
            "rounded-xl border px-4 py-4 text-left transition",
            value === "PICKUP"
              ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
              : "border-[var(--huza-line)] bg-white hover:border-[var(--huza-green)]/50"
          )}
        >
          <Store className="size-5 text-[var(--huza-green)]" aria-hidden />
          <p className="mt-2 text-sm font-bold text-[var(--huza-ink)]">Pickup from Youth Huza</p>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            Collect your order at our location. Free.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange("HOME_DELIVERY")}
          className={cn(
            "rounded-xl border px-4 py-4 text-left transition",
            value === "HOME_DELIVERY"
              ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
              : "border-[var(--huza-line)] bg-white hover:border-[var(--huza-green)]/50"
          )}
        >
          <MapPin className="size-5 text-[var(--huza-green)]" aria-hidden />
          <p className="mt-2 text-sm font-bold text-[var(--huza-ink)]">Home delivery</p>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">
            We deliver to your address. Delivery fee confirmed by phone.
          </p>
        </button>
      </div>

      {value === "PICKUP" ? (
        <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4 text-sm">
          <p className="font-semibold text-[var(--huza-green-dark)]">{pickup.locationName}</p>
          <p className="mt-1 text-[var(--huza-ink)]">{pickup.address}</p>
          <p className="mt-2 text-xs text-[var(--huza-muted)]">Hours: {pickup.hours}</p>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">Phone: {pickup.phoneDisplay}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pickup.mapsUrl ? (
              <a
                href={pickup.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-lg border border-[var(--huza-line)] px-3 text-xs font-semibold text-[var(--huza-green-dark)]"
              >
                Open map
              </a>
            ) : null}
            {pickupWa ? (
              <a
                href={pickupWa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-lg border border-[var(--huza-line)] px-3 text-xs font-semibold text-[var(--huza-green-dark)]"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
          {pickup.mapsUrl && /google\.com\/maps\/embed|maps\/embed/.test(pickup.mapsUrl) ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-[var(--huza-line)]">
              <iframe
                title="Youth Huza pickup map"
                src={pickup.mapsUrl}
                className="h-44 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
          <p className="mt-3 text-xs font-medium text-[var(--huza-green-dark)]">
            Pickup is free. We will notify you when your order is ready for collection.
            Your order reference number will appear after you place the order — bring it when you
            collect.
          </p>
        </div>
      ) : null}

      {value === "HOME_DELIVERY" ? (
        <div className="rounded-xl border border-[var(--huza-line)] bg-[var(--huza-cream,#F7FBF8)] p-4 text-sm leading-relaxed text-[var(--huza-muted)]">
          {HOME_DELIVERY_FEE_NOTICE}
        </div>
      ) : null}
    </div>
  );
}
