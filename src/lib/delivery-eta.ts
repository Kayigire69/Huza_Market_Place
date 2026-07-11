import type { DeliveryZoneKey } from "@/lib/utils";

/** Typical door-to-door minutes when items are in Huza stock */
export const ZONE_ETA_MINUTES: Record<DeliveryZoneKey, number> = {
  KIGALI: 45,
  KAMONYI_RUYENZI: 75,
  BUGESERA_NYAMATA: 75,
};

/** When Huza must source / restock before dispatch */
export const BACKORDER_ETA_HOURS = { min: 6, max: 12 } as const;

export function isInStock(stockQty: number, reservedQty = 0): boolean {
  return Math.max(0, stockQty - reservedQty) > 0;
}

export function formatZoneEta(zone: DeliveryZoneKey): string {
  const mins = ZONE_ETA_MINUTES[zone];
  return `About ${mins} minutes`;
}

export function formatBackorderEta(): string {
  return `${BACKORDER_ETA_HOURS.min}–${BACKORDER_ETA_HOURS.max} hours`;
}

/**
 * Customer-facing stock + delivery line.
 * Never say “not available” — zero stock means a 6–12 hour restock window.
 */
export function productFulfillmentLabel(
  stockQty: number,
  reservedQty = 0,
  zone: DeliveryZoneKey = "KIGALI"
): { inStock: boolean; stockLabel: string; etaLabel: string } {
  const inStock = isInStock(stockQty, reservedQty);
  if (inStock) {
    const available = Math.max(0, stockQty - reservedQty);
    return {
      inStock: true,
      stockLabel: available <= 5 ? "Low stock" : "In stock",
      etaLabel: formatZoneEta(zone),
    };
  }
  return {
    inStock: false,
    stockLabel: "Preparing fresh stock",
    etaLabel: formatBackorderEta(),
  };
}

/** Cart / checkout overall ETA: any zero-stock line forces the 6–12h window */
export function cartFulfillmentEta(
  items: Array<{ stockQty: number; quantity?: number }>,
  zone: DeliveryZoneKey,
  slot: "TODAY" | "TOMORROW" | "SCHEDULED" = "TODAY"
): { needsRestock: boolean; etaLabel: string; estimatedMinutes: number } {
  const needsRestock = items.some((i) => i.stockQty <= 0);
  if (needsRestock) {
    return {
      needsRestock: true,
      etaLabel: formatBackorderEta(),
      estimatedMinutes: BACKORDER_ETA_HOURS.max * 60,
    };
  }
  if (slot === "TOMORROW") {
    return { needsRestock: false, etaLabel: "Tomorrow", estimatedMinutes: 24 * 60 };
  }
  if (slot === "SCHEDULED") {
    return {
      needsRestock: false,
      etaLabel: "Scheduled — pick a date at checkout",
      estimatedMinutes: ZONE_ETA_MINUTES[zone],
    };
  }
  return {
    needsRestock: false,
    etaLabel: formatZoneEta(zone),
    estimatedMinutes: ZONE_ETA_MINUTES[zone],
  };
}
