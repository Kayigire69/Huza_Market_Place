import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notify-admins";
import { availableQty } from "@/repositories/product.repository";
import { SOFT_RESTOCK_ETA } from "@/lib/delivery-eta";

export { SOFT_RESTOCK_ETA };

/** Minimum time between the same kind of stock alert for one product. */
export const STOCK_ALERT_MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export type StockAlertKind = "LOW" | "EMPTY" | "RESTOCK_DEMAND";

export function softCapacity(lowStockAt: number, stockQty: number, reservedQty: number): number {
  return Math.max(lowStockAt * 4, stockQty + reservedQty, 10);
}

export function stockPercentLeft(
  available: number,
  lowStockAt: number,
  stockQty: number,
  reservedQty: number
): number {
  const cap = softCapacity(lowStockAt, stockQty, reservedQty);
  return Math.max(0, Math.min(100, Math.round((available / cap) * 100)));
}

async function canSendAlert(productId: string, kind: StockAlertKind): Promise<boolean> {
  const since = new Date(Date.now() - STOCK_ALERT_MIN_INTERVAL_MS);
  const recent = await prisma.stockAlertLog.findFirst({
    where: { productId, kind, sentAt: { gte: since } },
    select: { id: true },
  });
  return !recent;
}

async function sendThrottledAlert(input: {
  productId: string;
  kind: StockAlertKind;
  available: number;
  percentLeft: number;
  title: string;
  body: string;
  notificationType?: "LOW_STOCK" | "RESTOCK_REQUEST";
}): Promise<boolean> {
  if (!(await canSendAlert(input.productId, input.kind))) {
    return false;
  }

  try {
    await notifyAdmins({
      type: input.notificationType || (input.kind === "RESTOCK_DEMAND" ? "RESTOCK_REQUEST" : "LOW_STOCK"),
      title: input.title,
      body: input.body,
    });
  } catch (err) {
    console.error("[stock-alerts] notifyAdmins failed", err);
    return false;
  }

  await prisma.stockAlertLog.create({
    data: {
      productId: input.productId,
      kind: input.kind,
      available: input.available,
      percentLeft: input.percentLeft,
      title: input.title,
      body: input.body,
    },
  });
  return true;
}

/**
 * After stock changes: alert admins when empty or at/below threshold.
 * Throttled to at most once per kind per product per hour, with % remaining.
 */
export async function maybeNotifyStockLevel(product: {
  id: string;
  nameEn: string;
  stockQty: number;
  reservedQty: number;
  lowStockAt: number;
}): Promise<boolean> {
  const available = availableQty(product.stockQty, product.reservedQty);
  const percent = stockPercentLeft(
    available,
    product.lowStockAt,
    product.stockQty,
    product.reservedQty
  );

  if (available <= 0) {
    return sendThrottledAlert({
      productId: product.id,
      kind: "EMPTY",
      available: 0,
      percentLeft: 0,
      title: `Stock empty: ${product.nameEn}`,
      body: `${product.nameEn} has 0 available (0% of soft capacity). Source from farmers or market. Soft restock window: ${SOFT_RESTOCK_ETA.toLowerCase()}.`,
    });
  }

  if (available <= product.lowStockAt) {
    return sendThrottledAlert({
      productId: product.id,
      kind: "LOW",
      available,
      percentLeft: percent,
      title: `Low stock: ${product.nameEn} (${percent}% left)`,
      body: `Only ${available} available · ${percent}% of soft capacity (threshold ${product.lowStockAt}). Consider restocking before it sells out.`,
    });
  }

  return false;
}

/** Customer restock interest. Always saved; admin notify throttled hourly with demand count. */
export async function notifyRestockDemand(input: {
  productId: string;
  productName: string;
  customerLabel: string;
  openCount: number;
}) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { stockQty: true, reservedQty: true, lowStockAt: true },
  });
  if (!product) return false;

  const available = availableQty(product.stockQty, product.reservedQty);
  const percent = stockPercentLeft(
    available,
    product.lowStockAt,
    product.stockQty,
    product.reservedQty
  );

  return sendThrottledAlert({
    productId: input.productId,
    kind: "RESTOCK_DEMAND",
    available,
    percentLeft: percent,
    notificationType: "RESTOCK_REQUEST",
    title: `Customer restock ask: ${input.productName}`,
    body: `${input.customerLabel} requested ${input.productName}. Open requests: ${input.openCount}. Stock now: ${available} (${percent}% left). Soft ETA shown to customer: ${SOFT_RESTOCK_ETA.toLowerCase()}. Open Admin → Restock Requests.`,
  });
}

/**
 * Periodic scan for empty/low products (jobs cron). Same 1-hour throttle per product/kind.
 */
export async function scanAndNotifyStockLevels(take = 80) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      nameEn: true,
      stockQty: true,
      reservedQty: true,
      lowStockAt: true,
    },
    take: 500,
  });

  let sent = 0;
  for (const p of products) {
    const available = availableQty(p.stockQty, p.reservedQty);
    if (available > p.lowStockAt) continue;
    const ok = await maybeNotifyStockLevel(p);
    if (ok) {
      sent += 1;
      if (sent >= take) break;
    }
  }
  return { checked: products.length, sent };
}
