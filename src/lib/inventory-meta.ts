/**
 * Shared inventory metadata for Products from farmers vs market procurement.
 * Customer storefront should not expose these unless HUZA opts in later.
 */

export type InventorySource = "FARMER" | "MARKET";
export type PurchaseMethod = "DIRECT" | "COMMISSION" | "MARKET";

/** Phase 3 ops status. Mapped from stock + review without replacing shop enums. */
export type InventoryOpsStatus = "Available" | "Reserved" | "Sold Out" | "Rejected";

export const INVENTORY_SOURCE_LABELS: Record<InventorySource, string> = {
  FARMER: "Farm",
  MARKET: "Market",
};

export const PURCHASE_METHOD_LABELS: Record<PurchaseMethod, string> = {
  DIRECT: "Direct Purchase",
  COMMISSION: "Commission Sale",
  MARKET: "Local Market Purchase",
};

export function inventorySourceLabel(raw?: string | null): string {
  return INVENTORY_SOURCE_LABELS[resolveInventorySource(raw)];
}

export function purchaseMethodLabel(
  raw?: string | null,
  ownershipMode?: string | null,
  inventorySource?: string | null
): string {
  return PURCHASE_METHOD_LABELS[resolvePurchaseMethod(raw, ownershipMode, inventorySource)];
}

/** Never leave blank — Farm is the default for Huza stock. */
export function resolveInventorySource(raw?: string | null): InventorySource {
  const s = String(raw || "")
    .trim()
    .toUpperCase();
  if (s === "MARKET") return "MARKET";
  return "FARMER";
}

/** Never leave blank — Direct Purchase is the default. */
export function resolvePurchaseMethod(
  raw?: string | null,
  ownershipMode?: string | null,
  inventorySource?: string | null
): PurchaseMethod {
  const s = String(raw || "")
    .trim()
    .toUpperCase();
  if (s === "DIRECT" || s === "COMMISSION" || s === "MARKET") return s;
  if (ownershipMode === "COMMISSION") return "COMMISSION";
  if (resolveInventorySource(inventorySource) === "MARKET") return "MARKET";
  return "DIRECT";
}

/** Normalize free-text / A-B-C grades to Phase 3 Grade 1 | 2 | 3. */
export function normalizeQualityGrade(raw: unknown): string | null {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/^GRADE\s*/i, "");
  if (!s) return null;
  if (s === "1" || s === "A" || s === "I" || s === "ONE") return "1";
  if (s === "2" || s === "B" || s === "II" || s === "TWO") return "2";
  if (s === "3" || s === "C" || s === "III" || s === "THREE") return "3";
  const n = Number(s);
  if (n === 1 || n === 2 || n === 3) return String(n);
  return null;
}

export function purchaseMethodFromOwnership(mode?: string | null): PurchaseMethod {
  return mode === "COMMISSION" ? "COMMISSION" : "DIRECT";
}

export function purchaseMethodFromDealType(
  dealType?: string | null
): PurchaseMethod {
  if (dealType === "COMMISSION") return "COMMISSION";
  if (dealType === "MARKET_BUY") return "MARKET";
  return "DIRECT";
}

/** Human labels for procurement deal / method (Admin + inventory). */
export function dealTypeLabel(dealType?: string | null): string {
  if (dealType === "COMMISSION") return "Commission Sale";
  if (dealType === "MARKET_BUY") return "Local Market Purchase";
  return "Direct Purchase";
}

export type ProcurementProvenanceInput = {
  inventorySource: InventorySource;
  purchaseMethod: PurchaseMethod;
  ownershipMode?: "OWNED" | "COMMISSION";
  farmName?: string | null;
  farmerName?: string | null;
  marketName?: string | null;
  purchaseDate?: Date | string | null;
  purchasedById?: string | null;
};

/** Fields written onto Product so inventory inherits procurement history. */
export function productProcurementData(input: ProcurementProvenanceInput) {
  const source = resolveInventorySource(input.inventorySource);
  const method = resolvePurchaseMethod(
    input.purchaseMethod,
    input.ownershipMode,
    source
  );
  const purchaseDate = input.purchaseDate
    ? input.purchaseDate instanceof Date
      ? input.purchaseDate
      : new Date(input.purchaseDate)
    : null;

  return {
    inventorySource: source,
    purchaseMethod: method,
    ownershipMode:
      input.ownershipMode ||
      (method === "COMMISSION" ? ("COMMISSION" as const) : ("OWNED" as const)),
    procurementFarmName:
      source === "FARMER" ? String(input.farmName || "").trim() || null : null,
    procurementFarmerName:
      source === "FARMER" ? String(input.farmerName || "").trim() || null : null,
    procurementMarketName:
      source === "MARKET" ? String(input.marketName || "").trim() || null : null,
    procurementPurchaseDate:
      purchaseDate && !Number.isNaN(purchaseDate.getTime()) ? purchaseDate : null,
    purchasedById: input.purchasedById || null,
  };
}

/** Parse farmer harvest qty strings like "120", "120 kg", "120KG". */
export function parseHarvestQuantity(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  const s = String(raw).trim();
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Math.floor(Number(m[1]));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveConfirmedStockQty(opts: {
  confirmedQty?: unknown;
  stockQty?: number | null;
  totalQuantityHarvested?: string | null;
}): number | null {
  const fromBody = Number(opts.confirmedQty);
  if (Number.isFinite(fromBody) && fromBody > 0) return Math.floor(fromBody);
  if (opts.stockQty != null && opts.stockQty > 0) return Math.floor(opts.stockQty);
  return parseHarvestQuantity(opts.totalQuantityHarvested);
}

/**
 * Map Product stock/review fields → Phase 3 inventory status.
 * Does not replace ProductAvailability / reservedQty shop logic.
 */
export function deriveInventoryOpsStatus(p: {
  stockQty: number;
  reservedQty: number;
  reviewStatus?: string | null;
  isActive?: boolean | null;
}): InventoryOpsStatus {
  if (p.reviewStatus === "REJECTED") return "Rejected";
  const available = Math.max(0, (p.stockQty || 0) - (p.reservedQty || 0));
  if (available <= 0) return "Sold Out";
  if ((p.reservedQty || 0) > 0) return "Reserved";
  return "Available";
}

export function countInventoryOpsStatuses(
  products: Array<{
    stockQty: number;
    reservedQty: number;
    reviewStatus?: string | null;
  }>
): Record<InventoryOpsStatus, number> {
  const counts: Record<InventoryOpsStatus, number> = {
    Available: 0,
    Reserved: 0,
    "Sold Out": 0,
    Rejected: 0,
  };
  for (const p of products) {
    counts[deriveInventoryOpsStatus(p)] += 1;
  }
  return counts;
}
