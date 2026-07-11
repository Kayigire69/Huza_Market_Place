import { prisma } from "@/lib/prisma";

/** Shared admin workspace datasets used by module pages. */
export async function loadAdminWorkspace() {
  const [
    pendingSuppliers,
    allSuppliers,
    pendingFarmerProducts,
    deliveries,
    payments,
    reviews,
    lowStock,
    topProducts,
    promotions,
    businessHours,
    holidays,
    emergency,
    auditLogs,
    staffUsers,
    deliveryPeople,
    procurementOffers,
    purchaseOrders,
    allOrders,
    catalogProducts,
    recentMovements,
    customers,
  ] = await Promise.all([
    prisma.supplier.findMany({
      where: { status: "PENDING" },
      include: { user: true },
    }),
    prisma.supplier.findMany({
      include: { user: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { reviewStatus: "PENDING" },
      include: {
        supplier: { include: { user: true } },
        category: true,
        images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }], take: 12 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.delivery.findMany({
      include: { order: true, deliveryPerson: true },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.payment.findMany({
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.review.findMany({
      include: { user: true, product: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.product.findMany({
      where: { stockQty: { lte: 5 }, isActive: true, deletedAt: null },
      include: { supplier: true },
      take: 20,
    }),
    prisma.product.findMany({
      where: { isBestSeller: true },
      orderBy: { ratingCount: "desc" },
      take: 5,
    }),
    prisma.promotion.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.businessHours.findMany(),
    prisma.holiday.findMany({ orderBy: { date: "asc" } }),
    prisma.emergencyClosure.findMany({
      where: { isActive: true },
      take: 5,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.user.findMany({
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
    }),
    prisma.user.findMany({
      where: { role: "DELIVERY" },
      select: { id: true, fullName: true, phone: true },
    }),
    prisma.supplierOffer.findMany({
      include: { supplier: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.purchaseOrder.findMany({
      include: { supplier: true, offer: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      include: {
        payment: true,
        delivery: true,
        items: { include: { product: true, supplier: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.product.findMany({
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
    }),
    prisma.stockMovement.findMany({
      include: {
        product: { select: { id: true, nameEn: true, stockQty: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.user.findMany({
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
    }),
  ]);

  return {
    pendingSuppliers,
    allSuppliers,
    pendingFarmerProducts,
    deliveries,
    payments,
    reviews,
    lowStock,
    topProducts,
    promotions,
    businessHours,
    holidays,
    emergency,
    auditLogs,
    staffUsers,
    deliveryPeople,
    procurementOffers,
    purchaseOrders,
    orders: allOrders,
    catalogProducts,
    recentMovements,
    customers,
  };
}
