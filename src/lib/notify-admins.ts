import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";
import { getSetting } from "@/services/settings.service";

/** Push an in-app alert to every active admin (dashboard live feed). */
export async function notifyAdmins(input: {
  type: NotificationType;
  title: string;
  body: string;
}) {
  const isStockAlert = input.type === "LOW_STOCK" || input.type === "RESTOCK_REQUEST";

  // Stock alerts always reach admins (with % remaining; throttled ≥1h in stock-alerts.ts).
  if (!isStockAlert && (await getSetting("notify_inapp_enabled", "true")) === "false") return;

  if (input.type === "NEW_SUPPLIER") {
    if ((await getSetting("notify_new_farmer_enabled", "true")) === "false") return;
  }
  if (
    input.type === "ORDER_CONFIRMATION" ||
    input.type === "PAYMENT_CONFIRMATION" ||
    input.type === "ORDER_PACKED"
  ) {
    if ((await getSetting("notify_new_order_enabled", "true")) === "false") return;
  }

  const roles = isStockAlert
    ? (["ADMIN", "SUPER_ADMIN", "MANAGER", "INVENTORY", "WAREHOUSE"] as const)
    : (["ADMIN", "SUPER_ADMIN"] as const);

  const admins = await prisma.user.findMany({
    where: { role: { in: [...roles] }, isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: input.type,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
    })),
  });
}
