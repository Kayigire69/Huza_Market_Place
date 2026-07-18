import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FARMER_SUPPLY_CATEGORY_SLUGS,
  filterFarmerSupplyProducts,
} from "@/lib/farmer-supply";

export type FarmerPurchaseOrderRow = {
  id: string;
  poNumber: string;
  status: string;
  /** OUTRIGHT_BUY | COMMISSION */
  dealType: string;
  productName: string;
  category: string | null;
  unit: string;
  quantity: number;
  negotiatedPrice: number;
  totalAmount: number;
  commissionRate: number | null;
  saleAmount: number | null;
  commissionAmount: number | null;
  farmerNetAmount: number | null;
  qualityNotes: string | null;
  rejectionReason: string | null;
  recommendation: string | null;
  inspectedAt: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  paymentRef: string | null;
  createdAt: string;
};

/** Authenticated supplier context for workspace pages. Guests are sent to /farmer. */
export async function requireFarmerWorkspace() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/farmer");
  }

  if (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/account");
  }

  const farmer = await prisma.supplier.findFirst({
    where:
      (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && !session.user.supplierId
        ? { status: "APPROVED" }
        : { userId: session.user.id },
    include: {
      user: { select: { fullName: true } },
      products: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!farmer) {
    redirect("/farmer");
  }

  /** Only crop categories farmers can supply — not Huza kitchen (salads/juices). */
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...FARMER_SUPPLY_CATEGORY_SLUGS] } },
    orderBy: { sortOrder: "asc" },
  });

  /** Hide prepared storefront lines that may be seed-linked to a supplier by mistake. */
  const farmProducts = filterFarmerSupplyProducts(farmer.products);
  const farmerForPortal = { ...farmer, products: farmProducts };

  const purchaseOrdersRaw = await prisma.purchaseOrder.findMany({
    where: { supplierId: farmer.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      poNumber: true,
      status: true,
      dealType: true,
      productName: true,
      category: true,
      unit: true,
      quantity: true,
      negotiatedPrice: true,
      totalAmount: true,
      commissionRate: true,
      saleAmount: true,
      commissionAmount: true,
      farmerNetAmount: true,
      qualityNotes: true,
      rejectionReason: true,
      recommendation: true,
      inspectedAt: true,
      orderedAt: true,
      receivedAt: true,
      createdAt: true,
      paidAt: true,
      paymentRef: true,
      paymentMethod: true,
    },
  });

  const purchaseOrders: FarmerPurchaseOrderRow[] = purchaseOrdersRaw.map((po) => {
    const payoutAmount =
      po.dealType === "COMMISSION"
        ? (po.farmerNetAmount ?? po.totalAmount)
        : po.totalAmount;
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      dealType: po.dealType,
      productName: po.productName,
      category: po.category,
      unit: po.unit,
      quantity: po.quantity,
      negotiatedPrice: po.negotiatedPrice,
      totalAmount: payoutAmount,
      commissionRate: po.commissionRate,
      saleAmount: po.saleAmount,
      commissionAmount: po.commissionAmount,
      farmerNetAmount: po.farmerNetAmount,
      qualityNotes: po.qualityNotes,
      rejectionReason: po.rejectionReason,
      recommendation: po.recommendation,
      inspectedAt: po.inspectedAt?.toISOString() ?? null,
      orderedAt: po.orderedAt?.toISOString() ?? null,
      receivedAt: po.receivedAt?.toISOString() ?? null,
      paymentStatus: po.paidAt ? `Paid${po.paymentRef ? ` · ${po.paymentRef}` : ""}` : "Pending",
      paymentMethod: po.paymentMethod,
      paidAt: po.paidAt?.toISOString() ?? null,
      paymentRef: po.paymentRef,
      createdAt: po.createdAt.toISOString(),
    };
  });

  const pendingReviews = farmProducts.filter(
    (p) => !p.reviewStatus || p.reviewStatus === "PENDING"
  ).length;
  const rejectedProducts = farmProducts.filter((p) => p.reviewStatus === "REJECTED").length;
  const approvedProducts = farmProducts.filter((p) => p.reviewStatus === "APPROVED").length;
  const unpaidOrders = purchaseOrders.filter((po) => !po.paidAt && po.status !== "CANCELLED");
  const paidOrders = purchaseOrders.filter((po) => po.paidAt);
  const availableVolume = farmProducts.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0);
  const pendingPayoutAmount = unpaidOrders
    .filter((po) => !["REJECTED", "CANCELLED"].includes(po.status))
    .reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  const paidAmount = paidOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  const mainCrop = farmProducts
    .slice()
    .sort((a, b) => (Number(b.stockQty) || 0) - (Number(a.stockQty) || 0))[0];
  const primaryUnit = mainCrop?.unit || "kg";
  const distinctCropNames = new Set(
    farmProducts.map((p) => p.nameEn.trim().toLowerCase()).filter(Boolean)
  );

  return {
    session,
    farmer: farmerForPortal,
    categories,
    purchaseOrders,
    stats: {
      listed: distinctCropNames.size,
      cropBatches: farmProducts.length,
      pendingReviews,
      rejectedProducts,
      approvedProducts,
      unpaidOrders: unpaidOrders.length,
      paidOrders: paidOrders.length,
      openPurchaseOrders: purchaseOrders.filter(
        (po) => !["CANCELLED", "REJECTED", "PAID"].includes(po.status)
      ).length,
      availableVolume,
      pendingPayoutAmount,
      paidAmount,
      mainCropName: mainCrop?.nameEn ?? null,
      primaryUnit,
    },
  };
}
