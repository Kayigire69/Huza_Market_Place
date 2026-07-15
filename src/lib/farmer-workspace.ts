import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FarmerPurchaseOrderRow = {
  id: string;
  poNumber: string;
  status: string;
  productName: string;
  category: string | null;
  unit: string;
  quantity: number;
  negotiatedPrice: number;
  totalAmount: number;
  qualityNotes: string | null;
  rejectionReason: string | null;
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

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  const purchaseOrdersRaw = await prisma.purchaseOrder.findMany({
    where: { supplierId: farmer.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      poNumber: true,
      status: true,
      productName: true,
      category: true,
      unit: true,
      quantity: true,
      negotiatedPrice: true,
      totalAmount: true,
      qualityNotes: true,
      rejectionReason: true,
      inspectedAt: true,
      orderedAt: true,
      receivedAt: true,
      createdAt: true,
      paidAt: true,
      paymentRef: true,
      paymentMethod: true,
    },
  });

  const purchaseOrders: FarmerPurchaseOrderRow[] = purchaseOrdersRaw.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    productName: po.productName,
    category: po.category,
    unit: po.unit,
    quantity: po.quantity,
    negotiatedPrice: po.negotiatedPrice,
    totalAmount: po.totalAmount,
    qualityNotes: po.qualityNotes,
    rejectionReason: po.rejectionReason,
    inspectedAt: po.inspectedAt?.toISOString() ?? null,
    orderedAt: po.orderedAt?.toISOString() ?? null,
    receivedAt: po.receivedAt?.toISOString() ?? null,
    paymentStatus: po.paidAt ? `Paid${po.paymentRef ? ` · ${po.paymentRef}` : ""}` : "Pending",
    paymentMethod: po.paymentMethod,
    paidAt: po.paidAt?.toISOString() ?? null,
    paymentRef: po.paymentRef,
    createdAt: po.createdAt.toISOString(),
  }));

  const pendingReviews = farmer.products.filter(
    (p) => !p.reviewStatus || p.reviewStatus === "PENDING"
  ).length;
  const rejectedProducts = farmer.products.filter((p) => p.reviewStatus === "REJECTED").length;
  const approvedProducts = farmer.products.filter((p) => p.reviewStatus === "APPROVED").length;
  const unpaidOrders = purchaseOrders.filter((po) => !po.paidAt && po.status !== "CANCELLED");
  const paidOrders = purchaseOrders.filter((po) => po.paidAt);
  const availableVolume = farmer.products.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0);
  const pendingPayoutAmount = unpaidOrders
    .filter((po) => !["REJECTED", "CANCELLED"].includes(po.status))
    .reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  const paidAmount = paidOrders.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
  const mainCrop = farmer.products
    .slice()
    .sort((a, b) => (Number(b.stockQty) || 0) - (Number(a.stockQty) || 0))[0];
  const primaryUnit = mainCrop?.unit || "kg";

  return {
    session,
    farmer,
    categories,
    purchaseOrders,
    stats: {
      listed: farmer.products.length,
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
