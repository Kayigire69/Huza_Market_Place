/**
 * Shared inventory metadata for Products from farmers vs market procurement.
 * Customer storefront should not expose these unless HUZA opts in later.
 */

export type InventorySource = "FARMER" | "MARKET";
export type PurchaseMethod = "DIRECT" | "COMMISSION" | "MARKET";

/** Phase 3 ops status — mapped from stock + review without replacing shop enums. */
export type InventoryOpsStatus = "Available" | "Reserved" | "Sold Out" | "Rejected";

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
