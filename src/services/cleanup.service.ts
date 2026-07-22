/**
 * Super Admin system cleanup — permanent deletes with FK-safe handling.
 * Never call from non–Super Admin routes.
 */

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const STAFF_ROLES: Role[] = [
  "ADMIN",
  "MANAGER",
  "WAREHOUSE",
  "INVENTORY",
  "DELIVERY",
  "PROCUREMENT",
  "SUPPORT",
  "FINANCE",
  "SUPER_ADMIN",
];

export type CleanupSummary = {
  customers: number;
  farmers: number;
  staff: number;
  orders: number;
  cancelledOrFailedOrders: number;
  payments: number;
  products: number;
  softDeletedProducts: number;
  notifications: number;
  stockMovements: number;
};

export async function getCleanupSummary(): Promise<CleanupSummary> {
  const [
    customers,
    farmers,
    staff,
    orders,
    cancelledOrFailedOrders,
    payments,
    products,
    softDeletedProducts,
    notifications,
    stockMovements,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.supplier.count(),
    prisma.user.count({
      where: { role: { in: STAFF_ROLES }, deletedAt: null },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: {
        OR: [
          { status: "CANCELLED" },
          { payment: { status: { in: ["FAILED", "REFUNDED"] } } },
        ],
      },
    }),
    prisma.payment.count(),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: { not: null } } }),
    prisma.notification.count(),
    prisma.stockMovement.count(),
  ]);

  return {
    customers,
    farmers,
    staff,
    orders,
    cancelledOrFailedOrders,
    payments,
    products,
    softDeletedProducts,
    notifications,
    stockMovements,
  };
}

/** Detach FKs that would block User hard-delete, then delete. */
export async function hardDeleteUserAccount(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({ where: { userId }, data: { userId: null } });
    await tx.supportTicket.updateMany({ where: { userId }, data: { userId: null } });
    await tx.review.updateMany({ where: { repliedById: userId }, data: { repliedById: null } });
    await tx.delivery.updateMany({
      where: { deliveryPersonId: userId },
      data: { deliveryPersonId: null },
    });

    const supplier = await tx.supplier.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (supplier) {
      await prepareSupplierForDelete(tx, supplier.id);
      await tx.supplier.delete({ where: { id: supplier.id } });
    }

    await tx.user.delete({ where: { id: userId } });
  });
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Make a supplier deletable: soft-delete products with sales history;
 * hard-delete products with no order/receipt links; clear PO/receipt FKs when safe.
 */
async function prepareSupplierForDelete(tx: Tx, supplierId: string): Promise<void> {
  const products = await tx.product.findMany({
    where: { supplierId },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);

  for (const productId of productIds) {
    const [orderItems, receiptItems] = await Promise.all([
      tx.orderItem.count({ where: { productId } }),
      tx.goodsReceiptItem.count({ where: { productId } }),
    ]);
    if (orderItems > 0 || receiptItems > 0) {
      // Reassign OrderItems / receipt lines away from this supplier product is not possible
      // without destroying sale history — soft-delete product and move supplier FK via a
      // placeholder is heavy. Instead: soft-delete product and block supplier delete if
      // OrderItem.supplierId still points here.
      await tx.product.update({
        where: { id: productId },
        data: { deletedAt: new Date(), isActive: false, stockQty: 0 },
      });
    } else {
      await tx.product.delete({ where: { id: productId } });
    }
  }

  // OrderItems still referencing this supplier block delete
  const linkedItems = await tx.orderItem.count({ where: { supplierId } });
  if (linkedItems > 0) {
    throw new Error(
      "This farmer has sales history (order lines). Soft-remove them instead of permanent delete."
    );
  }

  const pos = await tx.purchaseOrder.findMany({
    where: { supplierId },
    select: { id: true },
  });
  for (const po of pos) {
    await tx.goodsReceipt.deleteMany({ where: { purchaseOrderId: po.id } });
  }
  await tx.goodsReceipt.deleteMany({ where: { supplierId } });
  await tx.purchaseOrder.deleteMany({ where: { supplierId } });
}

export async function hardDeleteStaffUser(opts: {
  targetId: string;
  actorId: string;
}): Promise<{ ok: true; fullName: string }> {
  const before = await prisma.user.findUnique({
    where: { id: opts.targetId },
    select: {
      id: true,
      fullName: true,
      role: true,
      isPrimarySuperAdmin: true,
      deletedAt: true,
    },
  });
  if (!before) throw new Error("Staff user not found");
  if (before.isPrimarySuperAdmin) {
    throw new Error("The primary Super Admin account cannot be deleted.");
  }
  if (before.role === "SUPER_ADMIN") {
    throw new Error("Super Admin accounts cannot be permanently deleted. Deactivate instead.");
  }
  if (opts.targetId === opts.actorId) {
    throw new Error("You cannot permanently delete your own account.");
  }
  const employeeRoles = STAFF_ROLES.filter((r) => r !== "SUPER_ADMIN");
  if (!employeeRoles.includes(before.role)) {
    throw new Error("Only staff employee accounts can be permanently deleted here.");
  }

  await hardDeleteUserAccount(opts.targetId);
  return { ok: true, fullName: before.fullName };
}

export async function hardDeleteCustomer(userId: string): Promise<{ fullName: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true },
  });
  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Customer not found");
  }
  await hardDeleteUserAccount(userId);
  return { fullName: user.fullName };
}

export async function hardDeleteFarmer(supplierId: string): Promise<{ businessName: string }> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, businessName: true, userId: true },
  });
  if (!supplier) throw new Error("Farmer not found");

  await prisma.$transaction(async (tx) => {
    await prepareSupplierForDelete(tx, supplier.id);
    await tx.supplier.delete({ where: { id: supplier.id } });
    await tx.order.updateMany({ where: { userId: supplier.userId }, data: { userId: null } });
    await tx.supportTicket.updateMany({
      where: { userId: supplier.userId },
      data: { userId: null },
    });
    await tx.review.updateMany({
      where: { repliedById: supplier.userId },
      data: { repliedById: null },
    });
    await tx.user.delete({ where: { id: supplier.userId } });
  });

  return { businessName: supplier.businessName };
}

/** Soft-remove farmer when hard delete is blocked by sales history. */
export async function softRemoveFarmer(supplierId: string): Promise<{ businessName: string }> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, businessName: true, userId: true },
  });
  if (!supplier) throw new Error("Farmer not found");

  await prisma.$transaction([
    prisma.product.updateMany({
      where: { supplierId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    }),
    prisma.supplier.update({
      where: { id: supplierId },
      data: { status: "REMOVED" },
    }),
    prisma.user.update({
      where: { id: supplier.userId },
      data: { isActive: false, deletedAt: new Date() },
    }),
  ]);

  return { businessName: supplier.businessName };
}

export async function deleteOrdersByIds(orderIds: string[]): Promise<number> {
  if (!orderIds.length) return 0;
  const result = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  return result.count;
}

/** Cancelled orders and orders whose payment failed/refunded — typical test leftovers. */
export async function deleteFailedTestOrders(): Promise<number> {
  const rows = await prisma.order.findMany({
    where: {
      OR: [
        { status: "CANCELLED" },
        { payment: { status: { in: ["FAILED", "REFUNDED"] } } },
      ],
    },
    select: { id: true },
  });
  if (!rows.length) return 0;
  const result = await prisma.order.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  });
  return result.count;
}

export async function softDeleteProductsByIds(productIds: string[]): Promise<number> {
  if (!productIds.length) return 0;
  const result = await prisma.product.updateMany({
    where: { id: { in: productIds }, deletedAt: null },
    data: { deletedAt: new Date(), isActive: false },
  });
  return result.count;
}

/** Hard-delete products with no order/receipt history; soft-delete the rest. */
export async function purgeSoftDeletedProducts(): Promise<{
  hardDeleted: number;
  keptSoft: number;
}> {
  const soft = await prisma.product.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true },
  });
  let hardDeleted = 0;
  let keptSoft = 0;
  for (const p of soft) {
    const [orderItems, receiptItems] = await Promise.all([
      prisma.orderItem.count({ where: { productId: p.id } }),
      prisma.goodsReceiptItem.count({ where: { productId: p.id } }),
    ]);
    if (orderItems > 0 || receiptItems > 0) {
      keptSoft += 1;
      continue;
    }
    await prisma.product.delete({ where: { id: p.id } });
    hardDeleted += 1;
  }
  return { hardDeleted, keptSoft };
}

export async function deleteAllNotifications(): Promise<number> {
  const result = await prisma.notification.deleteMany({});
  return result.count;
}

export async function deleteStockMovementsForSoftDeletedProducts(): Promise<number> {
  const soft = await prisma.product.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true },
  });
  if (!soft.length) return 0;
  // StockMovement cascades on product hard-delete; for soft-deleted, clear movements explicitly
  const result = await prisma.stockMovement.deleteMany({
    where: { productId: { in: soft.map((p) => p.id) } },
  });
  return result.count;
}

export async function listCleanupCustomers(q?: string) {
  return prisma.user.findMany({
    where: {
      role: Role.CUSTOMER,
      ...(q?.trim()
        ? {
            OR: [
              { fullName: { contains: q.trim(), mode: "insensitive" } },
              { email: { contains: q.trim(), mode: "insensitive" } },
              { phone: { contains: q.trim() } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listCleanupFarmers(q?: string) {
  return prisma.supplier.findMany({
    where: {
      ...(q?.trim()
        ? {
            OR: [
              { businessName: { contains: q.trim(), mode: "insensitive" } },
              { phone: { contains: q.trim() } },
              { email: { contains: q.trim(), mode: "insensitive" } },
              { user: { fullName: { contains: q.trim(), mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      businessName: true,
      phone: true,
      email: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, fullName: true, isActive: true, deletedAt: true } },
      _count: { select: { products: true, purchaseOrders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listCleanupOrders(limit = 50) {
  return prisma.order.findMany({
    where: {
      OR: [
        { status: "CANCELLED" },
        { payment: { status: { in: ["FAILED", "REFUNDED"] } } },
      ],
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      guestName: true,
      guestPhone: true,
      createdAt: true,
      payment: { select: { status: true, method: true } },
      user: { select: { fullName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
