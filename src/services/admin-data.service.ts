import { prisma } from "@/lib/prisma";

export type AdminWorkspaceTab =
  | "overview"
  | "suppliers"
  | "products"
  | "catalog"
  | "inventory"
  | "procurement"
  | "orders"
  | "delivery"
  | "payments"
  | "reviews"
  | "promos"
  | "hours"
  | "reports"
  | "audit"
  | "staff";

const empty = {
  pendingSuppliers: [] as Awaited<ReturnType<typeof loadPendingSuppliers>>,
  allSuppliers: [] as Awaited<ReturnType<typeof loadAllSuppliers>>,
  pendingFarmerProducts: [] as Awaited<ReturnType<typeof loadPendingFarmerProducts>>,
  deliveries: [] as Awaited<ReturnType<typeof loadDeliveries>>,
  payments: [] as Awaited<ReturnType<typeof loadPayments>>,
  reviews: [] as Awaited<ReturnType<typeof loadReviews>>,
  lowStock: [] as Awaited<ReturnType<typeof loadLowStock>>,
  topProducts: [] as Awaited<ReturnType<typeof loadTopProducts>>,
  promotions: [] as Awaited<ReturnType<typeof loadPromotions>>,
  businessHours: [] as Awaited<ReturnType<typeof loadBusinessHours>>,
  holidays: [] as Awaited<ReturnType<typeof loadHolidays>>,
  emergency: [] as Awaited<ReturnType<typeof loadEmergency>>,
  auditLogs: [] as Awaited<ReturnType<typeof loadAuditLogs>>,
  staffUsers: [] as Awaited<ReturnType<typeof loadStaffUsers>>,
  deliveryPeople: [] as Awaited<ReturnType<typeof loadDeliveryPeople>>,
  procurementOffers: [] as Awaited<ReturnType<typeof loadProcurementOffers>>,
  purchaseOrders: [] as Awaited<ReturnType<typeof loadPurchaseOrders>>,
  orders: [] as Awaited<ReturnType<typeof loadOrders>>,
  catalogProducts: [] as Awaited<ReturnType<typeof loadCatalogProducts>>,
  recentMovements: [] as Awaited<ReturnType<typeof loadRecentMovements>>,
  customers: [] as Awaited<ReturnType<typeof loadCustomers>>,
};

async function loadPendingSuppliers() {
  return prisma.supplier.findMany({
    where: { status: "PENDING" },
    include: { user: true },
  });
}

async function loadAllSuppliers() {
  return prisma.supplier.findMany({
    include: { user: true, _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function loadPendingFarmerProducts() {
  return prisma.product.findMany({
    where: { reviewStatus: "PENDING" },
    include: {
      supplier: { include: { user: true } },
      category: true,
      images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }], take: 12 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function loadDeliveries() {
  return prisma.delivery.findMany({
    include: { order: true, deliveryPerson: true },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });
}

async function loadPayments() {
  return prisma.payment.findMany({
    include: { order: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

async function loadReviews() {
  return prisma.review.findMany({
    include: { user: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

async function loadLowStock() {
  const candidates = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: { supplier: true },
    orderBy: { stockQty: "asc" },
    take: 120,
  });
  return candidates
    .filter((p) => Math.max(0, p.stockQty - (p.reservedQty || 0)) <= (p.lowStockAt ?? 5))
    .slice(0, 20);
}

async function loadTopProducts() {
  return prisma.product.findMany({
    where: { isBestSeller: true },
    orderBy: { ratingCount: "desc" },
    take: 5,
  });
}

async function loadPromotions() {
  return prisma.promotion.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
}

async function loadBusinessHours() {
  return prisma.businessHours.findMany();
}

async function loadHolidays() {
  return prisma.holiday.findMany({ orderBy: { date: "asc" } });
}

async function loadEmergency() {
  return prisma.emergencyClosure.findMany({
    where: { isActive: true },
    take: 5,
  });
}

async function loadAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

async function loadStaffUsers() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "WAREHOUSE", "DELIVERY", "PROCUREMENT", "SUPPORT"] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });
}

async function loadDeliveryPeople() {
  return prisma.user.findMany({
    where: { role: "DELIVERY" },
    select: { id: true, fullName: true, phone: true },
  });
}

async function loadProcurementOffers() {
  return prisma.supplierOffer.findMany({
    include: { supplier: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function loadPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: { supplier: true, offer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function loadOrders() {
  return prisma.order.findMany({
    include: {
      payment: true,
      delivery: true,
      items: { include: { product: true, supplier: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
}

async function loadCatalogProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      supplier: { select: { id: true, businessName: true, farmingType: true } },
      images: {
        orderBy: [{ kind: "asc" }, { isCover: "desc" }, { sortOrder: "asc" }],
        take: 8,
      },
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    take: 120,
  });
}

async function loadRecentMovements() {
  return prisma.stockMovement.findMany({
    include: {
      product: { select: { id: true, nameEn: true, stockQty: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

async function loadCustomers() {
  return prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
}

/** Full workspace (legacy). Prefer loadAdminWorkspaceForTab for route pages. */
export async function loadAdminWorkspace() {
  return loadAdminWorkspaceForTab("reports");
}

/**
 * Load only the datasets needed for one admin module so navigation stays fast.
 * Same UI/data shapes — unused arrays are empty.
 */
export async function loadAdminWorkspaceForTab(tab: AdminWorkspaceTab) {
  const base = { ...empty };

  switch (tab) {
    case "overview":
      return base;
    case "suppliers": {
      const [pendingSuppliers, allSuppliers] = await Promise.all([
        loadPendingSuppliers(),
        loadAllSuppliers(),
      ]);
      return { ...base, pendingSuppliers, allSuppliers };
    }
    case "products": {
      const pendingFarmerProducts = await loadPendingFarmerProducts();
      return { ...base, pendingFarmerProducts };
    }
    case "catalog": {
      const catalogProducts = await loadCatalogProducts();
      return { ...base, catalogProducts };
    }
    case "inventory": {
      const [catalogProducts, recentMovements, lowStock] = await Promise.all([
        loadCatalogProducts(),
        loadRecentMovements(),
        loadLowStock(),
      ]);
      return { ...base, catalogProducts, recentMovements, lowStock };
    }
    case "procurement": {
      const [procurementOffers, purchaseOrders] = await Promise.all([
        loadProcurementOffers(),
        loadPurchaseOrders(),
      ]);
      return { ...base, procurementOffers, purchaseOrders };
    }
    case "orders": {
      const [orders, deliveryPeople] = await Promise.all([loadOrders(), loadDeliveryPeople()]);
      return { ...base, orders, deliveryPeople };
    }
    case "delivery": {
      const [deliveries, deliveryPeople] = await Promise.all([
        loadDeliveries(),
        loadDeliveryPeople(),
      ]);
      return { ...base, deliveries, deliveryPeople };
    }
    case "payments": {
      const payments = await loadPayments();
      return { ...base, payments };
    }
    case "reviews": {
      const reviews = await loadReviews();
      return { ...base, reviews };
    }
    case "promos": {
      const promotions = await loadPromotions();
      return { ...base, promotions };
    }
    case "hours": {
      const [businessHours, holidays, emergency] = await Promise.all([
        loadBusinessHours(),
        loadHolidays(),
        loadEmergency(),
      ]);
      return { ...base, businessHours, holidays, emergency };
    }
    case "reports": {
      const [orders, allSuppliers, lowStock, deliveries, payments] = await Promise.all([
        loadOrders(),
        loadAllSuppliers(),
        loadLowStock(),
        loadDeliveries(),
        loadPayments(),
      ]);
      return { ...base, orders, allSuppliers, lowStock, deliveries, payments };
    }
    case "audit": {
      const auditLogs = await loadAuditLogs();
      return { ...base, auditLogs };
    }
    case "staff": {
      const staffUsers = await loadStaffUsers();
      return { ...base, staffUsers };
    }
    default:
      return base;
  }
}

export async function loadAdminCustomers() {
  return loadCustomers();
}
