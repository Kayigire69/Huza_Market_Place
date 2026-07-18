import {
  FLAT_DELIVERY_FEE_RWF,
  type DeliveryZoneDto,
  type DeliveryZoneKey,
  isDeliveryZoneKey,
} from "@/lib/utils";
import { estimateArrivalWindow } from "@/lib/geo/delivery-zone";

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

/** Flat delivery fee: prefer zone config when provided, else constant fallback. */
export function zoneFee(zone?: string, zones?: DeliveryZoneDto[]): number {
  if (zones && zones.length > 0) {
    const match = (zone && zones.find((z) => z.code === zone)) || zones[0];
    if (match && Number.isFinite(match.feeRwf) && match.feeRwf >= 0) {
      return Math.round(match.feeRwf);
    }
  }
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

export type FulfillmentEta = {
  needsRestock: boolean;
  /** Full label: "Today · 2:00 PM – 3:30 PM" */
  etaLabel: string;
  dayLabel: string;
  windowLabel: string;
  estimatedMinutes: number;
};

/** Cart / checkout overall ETA as a calendar day + clock window */
export function cartFulfillmentEta(
  items: Array<{ stockQty: number; reservedQty?: number; quantity?: number }>,
  zone: string,
  slot: "TODAY" | "TOMORROW" | "SCHEDULED" = "TODAY",
  zones?: DeliveryZoneDto[]
): FulfillmentEta {
  const zoneKey: DeliveryZoneKey = isDeliveryZoneKey(zone) ? zone : "KIGALI";
  const needsRestock = items.some((i) => {
    const available = Math.max(0, i.stockQty - (i.reservedQty ?? 0));
    const qty = i.quantity ?? 1;
    return available < qty;
  });

  if (needsRestock) {
    const start = new Date();
    start.setHours(start.getHours() + BACKORDER_ETA_HOURS.min);
    const end = new Date();
    end.setHours(end.getHours() + BACKORDER_ETA_HOURS.max);
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const dayLabel = "Today / Tomorrow";
    const windowLabel = `${fmt(start)} – ${fmt(end)}`;
    return {
      needsRestock: true,
      dayLabel,
      windowLabel,
      etaLabel: `${dayLabel} · ${windowLabel}`,
      estimatedMinutes: BACKORDER_ETA_HOURS.max * 60,
    };
  }

  if (slot === "SCHEDULED") {
    return {
      needsRestock: false,
      dayLabel: "Scheduled",
      windowLabel: "Pick a day at checkout",
      etaLabel: "Scheduled — pick a date at checkout",
      estimatedMinutes: zoneEtaMinutes(zoneKey, zones),
    };
  }

  const arrival = estimateArrivalWindow(zoneKey, slot === "TOMORROW" ? "TOMORROW" : "TODAY");
  return {
    needsRestock: false,
    dayLabel: arrival.dayLabel,
    windowLabel: arrival.windowLabel,
    etaLabel: arrival.label,
    estimatedMinutes: zoneEtaMinutes(zoneKey, zones),
  };
}
