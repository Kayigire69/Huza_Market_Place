/**
 * Extra System Cleanup helpers: test-data detection, archive/restore, wizard preview.
 * Used only by Super Admin cleanup routes.
 */

import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";
import {
  hardDeleteCustomer,
  hardDeleteFarmer,
  softRemoveFarmer,
  deleteOrdersByIds,
  softDeleteProductsByIds,
} from "@/services/cleanup.service";

export const TEST_CUSTOMER_PHONES = ["0788000002"] as const;
export const TEST_FARMER_PHONES = [
  "0781111001",
  "0781111002",
  "0781111003",
  "0781111999",
  "0781111888",
  "0781111777",
] as const;

export const TEST_FARMER_NAMES = [
  "Green Valley Farm",
  "Fresh Fields Cooperative",
  "Lake Harvest",
  "Sunrise Honey Co-op",
  "Youth Huza Kitchen",
  "Youth Huza Sourcing Pool",
] as const;

const testCustomerWhere: Prisma.UserWhereInput = {
  role: Role.CUSTOMER,
  deletedAt: null,
  OR: [
    { email: { endsWith: "@example.com" } },
    { phone: { in: [...TEST_CUSTOMER_PHONES] } },
  ],
};

const testFarmerWhere: Prisma.SupplierWhereInput = {
  status: { not: "REMOVED" },
  OR: [
    { phone: { in: [...TEST_FARMER_PHONES] } },
    { businessName: { in: [...TEST_FARMER_NAMES] } },
  ],
};

const testOrderWhere: Prisma.OrderWhereInput = {
  OR: [
    { orderNumber: "HUZA-1001" },
    { payment: { transactionRef: { startsWith: "DEMO-" } } },
    { payment: { transactionRef: { startsWith: "MTN-DEMO-" } } },
    { user: { phone: { in: [...TEST_CUSTOMER_PHONES] } } },
    { payment: { phoneNumber: { in: [...TEST_CUSTOMER_PHONES] } } },
    {
      AND: [
        {
          OR: [
            { status: "CANCELLED" },
            { payment: { status: { in: ["FAILED", "REFUNDED"] } } },
          ],
        },
        {
          OR: [
            { user: { email: { endsWith: "@example.com" } } },
            { guestPhone: { in: [...TEST_CUSTOMER_PHONES] } },
          ],
        },
      ],
    },
  ],
};

/** Cancelled / failed / refunded leftovers — never completed paid business orders. */
export const safeOrderDeleteWhere: Prisma.OrderWhereInput = {
  OR: [
    { status: "CANCELLED" },
    { payment: { status: { in: ["FAILED", "REFUNDED"] } } },
  ],
};

export type WizardSelection = {
  testCustomers?: boolean;
  testFarmers?: boolean;
  testOrders?: boolean;
  testInventory?: boolean;
  readNotifications?: boolean;
};

export type WizardPreview = {
  customers: number;
  farmers: number;
  orders: number;
  inventory: number;
  notifications: number;
  customerIds: string[];
  farmerIds: string[];
  orderIds: string[];
  productIds: string[];
  notificationIds: string[];
};

export async function previewCleanupWizard(sel: WizardSelection): Promise<WizardPreview> {
  const empty: WizardPreview = {
    customers: 0,
    farmers: 0,
    orders: 0,
    inventory: 0,
    notifications: 0,
    customerIds: [],
    farmerIds: [],
    orderIds: [],
    productIds: [],
    notificationIds: [],
  };

  if (sel.testCustomers) {
    const rows = await prisma.user.findMany({
      where: testCustomerWhere,
      select: { id: true },
      take: 500,
    });
    empty.customerIds = rows.map((r) => r.id);
    empty.customers = rows.length;
  }

  if (sel.testFarmers) {
    const rows = await prisma.supplier.findMany({
      where: testFarmerWhere,
      select: { id: true },
      take: 500,
    });
    empty.farmerIds = rows.map((r) => r.id);
    empty.farmers = rows.length;
  }

  if (sel.testOrders) {
    const rows = await prisma.order.findMany({
      where: testOrderWhere,
      select: { id: true },
      take: 500,
    });
    empty.orderIds = rows.map((r) => r.id);
    empty.orders = rows.length;
  }

  if (sel.testInventory) {
    const ids = await findDuplicateOrDemoProductIds();
    empty.productIds = ids;
    empty.inventory = ids.length;
  }

  if (sel.readNotifications) {
    const rows = await prisma.notification.findMany({
      where: { isRead: true },
      select: { id: true },
      take: 2000,
    });
    empty.notificationIds = rows.map((r) => r.id);
    empty.notifications = rows.length;
  }

  return empty;
}

async function findDuplicateOrDemoProductIds(): Promise<string[]> {
  const demoSupplier = await prisma.supplier.findMany({
    where: testFarmerWhere,
    select: { id: true },
  });
  const demoSupplierIds = demoSupplier.map((s) => s.id);

  const fromDemoFarmers =
    demoSupplierIds.length > 0
      ? await prisma.product.findMany({
          where: { supplierId: { in: demoSupplierIds }, deletedAt: null },
          select: { id: true },
          take: 500,
        })
      : [];

  const active = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, nameEn: true, categoryId: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });

  const seen = new Map<string, string>();
  const dupIds: string[] = [];
  for (const p of active) {
    const key = `${p.categoryId}::${p.nameEn.trim().toLowerCase()}`;
    const keep = seen.get(key);
    if (!keep) {
      seen.set(key, p.id);
      continue;
    }
    // Older duplicate (already passed newer first) → candidate for cleanup
    dupIds.push(p.id);
  }

  return [...new Set([...fromDemoFarmers.map((p) => p.id), ...dupIds])];
}

export async function runCleanupWizard(
  sel: WizardSelection
): Promise<{ preview: WizardPreview; results: Record<string, number | string[]> }> {
  const preview = await previewCleanupWizard(sel);
  const results: Record<string, number | string[]> = {};

  if (preview.customerIds.length) {
    const deleted: string[] = [];
    const errors: string[] = [];
    for (const id of preview.customerIds) {
      try {
        const r = await hardDeleteCustomer(id);
        deleted.push(r.fullName);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "failed");
      }
    }
    results.customersDeleted = deleted.length;
    results.customerErrors = errors;
  }

  if (preview.farmerIds.length) {
    let soft = 0;
    let hard = 0;
    const errors: string[] = [];
    for (const id of preview.farmerIds) {
      try {
        await hardDeleteFarmer(id);
        hard += 1;
      } catch {
        try {
          await softRemoveFarmer(id);
          soft += 1;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : "failed");
        }
      }
    }
    results.farmersHardDeleted = hard;
    results.farmersSoftRemoved = soft;
    results.farmerErrors = errors;
  }

  if (preview.orderIds.length) {
    results.ordersDeleted = await deleteOrdersByIds(preview.orderIds);
  }

  if (preview.productIds.length) {
    results.inventoryArchived = await softDeleteProductsByIds(preview.productIds);
  }

  if (preview.notificationIds.length) {
    const r = await prisma.notification.deleteMany({
      where: { id: { in: preview.notificationIds } },
    });
    results.notificationsDeleted = r.count;
  }

  return { preview, results };
}

export async function getTestDataCounts() {
  const [customers, farmers, orders, inventory, readNotifications] = await Promise.all([
    prisma.user.count({ where: testCustomerWhere }),
    prisma.supplier.count({ where: testFarmerWhere }),
    prisma.order.count({ where: testOrderWhere }),
    findDuplicateOrDemoProductIds().then((ids) => ids.length),
    prisma.notification.count({ where: { isRead: true } }),
  ]);
  return { customers, farmers, orders, inventory, readNotifications };
}

export async function archiveCustomer(userId: string): Promise<{ fullName: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true, deletedAt: true },
  });
  if (!user || user.role !== "CUSTOMER") throw new Error("Customer not found");
  if (user.deletedAt) throw new Error("Customer is already archived");
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { fullName: user.fullName };
}

export async function restoreCustomer(userId: string): Promise<{ fullName: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true, deletedAt: true },
  });
  if (!user || user.role !== "CUSTOMER") throw new Error("Customer not found");
  if (!user.deletedAt) throw new Error("Customer is not archived");
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null, isActive: true },
  });
  return { fullName: user.fullName };
}

export async function restoreFarmer(supplierId: string): Promise<{ businessName: string }> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true, businessName: true, userId: true, status: true },
  });
  if (!supplier) throw new Error("Farmer not found");
  await prisma.$transaction([
    prisma.supplier.update({
      where: { id: supplierId },
      data: { status: "APPROVED" },
    }),
    prisma.user.update({
      where: { id: supplier.userId },
      data: { deletedAt: null, isActive: true },
    }),
  ]);
  return { businessName: supplier.businessName };
}

export async function restoreProduct(productId: string): Promise<{ nameEn: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, nameEn: true, deletedAt: true },
  });
  if (!product) throw new Error("Product not found");
  if (!product.deletedAt) throw new Error("Product is not archived");
  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: null, isActive: true, reviewStatus: "APPROVED", reviewedAt: new Date() },
  });
  return { nameEn: product.nameEn };
}

export async function listArchivedRecords() {
  const [customers, farmers, products] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CUSTOMER, deletedAt: { not: null } },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        deletedAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { deletedAt: "desc" },
      take: 100,
    }),
    prisma.supplier.findMany({
      where: { status: "REMOVED" },
      select: {
        id: true,
        businessName: true,
        phone: true,
        createdAt: true,
        user: { select: { fullName: true, deletedAt: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        nameEn: true,
        deletedAt: true,
        category: { select: { nameEn: true } },
      },
      orderBy: { deletedAt: "desc" },
      take: 100,
    }),
  ]);
  return { customers, farmers, products };
}

export async function deleteReadNotifications(): Promise<number> {
  const r = await prisma.notification.deleteMany({ where: { isRead: true } });
  return r.count;
}

export async function deleteOldNotifications(olderThanDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const r = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return r.count;
}

export async function deleteTestNotifications(): Promise<number> {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@example.com" } },
        { phone: { in: [...TEST_CUSTOMER_PHONES, ...TEST_FARMER_PHONES] } },
      ],
    },
    select: { id: true },
  });
  if (!testUsers.length) return 0;
  const r = await prisma.notification.deleteMany({
    where: { userId: { in: testUsers.map((u) => u.id) } },
  });
  return r.count;
}

export async function listCleanupOrdersFiltered(opts?: {
  q?: string;
  onlySafe?: boolean;
}) {
  const q = opts?.q?.trim();
  return prisma.order.findMany({
    where: {
      ...(opts?.onlySafe !== false ? safeOrderDeleteWhere : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { guestName: { contains: q, mode: "insensitive" } },
              { guestPhone: { contains: q } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
              { user: { phone: { contains: q } } },
            ],
          }
        : {}),
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
    take: 100,
  });
}

/** Soft-delete duplicate active products (same category + name); keeps newest. */
export async function archiveDuplicateInventory(): Promise<number> {
  const ids = await findDuplicateOrDemoProductIds();
  // Only archive true duplicates (not all demo farmer stock) — filter to dups only
  const active = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, nameEn: true, categoryId: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });
  const seen = new Map<string, string>();
  const dupIds: string[] = [];
  for (const p of active) {
    const key = `${p.categoryId}::${p.nameEn.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, p.id);
      continue;
    }
    dupIds.push(p.id);
  }
  void ids;
  return softDeleteProductsByIds(dupIds);
}

export async function archiveTestInventory(): Promise<number> {
  const demoSupplier = await prisma.supplier.findMany({
    where: testFarmerWhere,
    select: { id: true },
  });
  if (!demoSupplier.length) return 0;
  const products = await prisma.product.findMany({
    where: { supplierId: { in: demoSupplier.map((s) => s.id) }, deletedAt: null },
    select: { id: true },
  });
  return softDeleteProductsByIds(products.map((p) => p.id));
}

export async function listCleanupCustomersActive(q?: string) {
  return prisma.user.findMany({
    where: {
      role: Role.CUSTOMER,
      deletedAt: null,
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
