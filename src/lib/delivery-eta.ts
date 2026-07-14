import {
  FLAT_DELIVERY_FEE_RWF,
  type DeliveryZoneDto,
  type DeliveryZoneKey,
  isDeliveryZoneKey,
} from "@/lib/utils";

/**
 * Typical door-to-door minutes (upper bound) when items are in Huza stock.
 * Used for scheduling / estimatedMinutes on Delivery records.
 */
export const ZONE_ETA_MINUTES: Record<DeliveryZoneKey, number> = {
  KIGALI: 55,
  KAMONYI_RUYENZI: 120,
  BUGESERA_NYAMATA: 120,
};

/** Customer-facing ETA ranges for delivery destinations */
export const ZONE_ETA_LABELS: Record<DeliveryZoneKey, string> = {
  KIGALI: "45–60 minutes",
  KAMONYI_RUYENZI: "About 2 hours",
  BUGESERA_NYAMATA: "About 2 hours",
};

/** When Huza must source / restock before dispatch */
export const BACKORDER_ETA_HOURS = { min: 6, max: 12 } as const;

export function isInStock(stockQty: number, reservedQty = 0): boolean {
  return Math.max(0, stockQty - reservedQty) > 0;
}

export function formatZoneEta(zone: string, _zones?: DeliveryZoneDto[]): string {
  if (isDeliveryZoneKey(zone)) return ZONE_ETA_LABELS[zone];
  return ZONE_ETA_LABELS.KIGALI;
}

export function zoneEtaMinutes(zone: string, _zones?: DeliveryZoneDto[]): number {
  if (isDeliveryZoneKey(zone)) return ZONE_ETA_MINUTES[zone];
  return ZONE_ETA_MINUTES.KIGALI;
}

/** Flat 5,000 RWF for every destination. */
export function zoneFee(_zone?: string, _zones?: DeliveryZoneDto[]): number {
  return FLAT_DELIVERY_FEE_RWF;
}

export function formatBackorderEta(): string {
  return `${BACKORDER_ETA_HOURS.min}–${BACKORDER_ETA_HOURS.max} hours`;
}

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

/**
 * Customer-facing stock + delivery line.
 * Zero available = Out of Stock (blocked from cart).
 */
export function productFulfillmentLabel(
  stockQty: number,
  reservedQty = 0,
  zone: string = "KIGALI",
  zones?: DeliveryZoneDto[],
  lowStockAt = 5
): {
  inStock: boolean;
  stockStatus: StockStatus;
  stockLabel: string;
  etaLabel: string;
  available: number;
  onlyNLeft: number | null;
} {
  const available = Math.max(0, stockQty - reservedQty);
  if (available <= 0) {
    return {
      inStock: false,
      stockStatus: "OUT_OF_STOCK",
      stockLabel: "Out of Stock",
      etaLabel: formatBackorderEta(),
      available: 0,
      onlyNLeft: null,
    };
  }
  const low = available <= lowStockAt;
  return {
    inStock: true,
    stockStatus: low ? "LOW_STOCK" : "IN_STOCK",
    stockLabel: low ? "Low Stock" : "In Stock",
    etaLabel: formatZoneEta(zone, zones),
    available,
    onlyNLeft: low ? available : null,
  };
}

/** Cart / checkout overall ETA: any zero-stock line forces the 6–12h window */
export function cartFulfillmentEta(
  items: Array<{ stockQty: number; quantity?: number }>,
  zone: string,
  slot: "TODAY" | "TOMORROW" | "SCHEDULED" = "TODAY",
  zones?: DeliveryZoneDto[]
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
      estimatedMinutes: zoneEtaMinutes(zone, zones),
    };
  }
  return {
    needsRestock: false,
    etaLabel: formatZoneEta(zone, zones),
    estimatedMinutes: zoneEtaMinutes(zone, zones),
  };
}
