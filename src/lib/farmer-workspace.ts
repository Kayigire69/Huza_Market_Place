import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FarmerPurchaseOrderRow = {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  qualityNotes: string | null;
  rejectionReason: string | null;
  inspectedAt: string | null;
  paymentStatus: string;
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
      totalAmount: true,
      qualityNotes: true,
      rejectionReason: true,
      inspectedAt: true,
      createdAt: true,
      paidAt: true,
      paymentRef: true,
    },
  });

  const purchaseOrders: FarmerPurchaseOrderRow[] = purchaseOrdersRaw.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    totalAmount: po.totalAmount,
    qualityNotes: po.qualityNotes,
    rejectionReason: po.rejectionReason,
    inspectedAt: po.inspectedAt?.toISOString() ?? null,
    paymentStatus: po.paidAt ? `Paid${po.paymentRef ? ` · ${po.paymentRef}` : ""}` : "Pending",
    paidAt: po.paidAt?.toISOString() ?? null,
    paymentRef: po.paymentRef,
    createdAt: po.createdAt.toISOString(),
  }));

  const pendingReviews = farmer.products.filter(
    (p) => !p.reviewStatus || p.reviewStatus === "PENDING"
  ).length;
  const rejectedProducts = farmer.products.filter((p) => p.reviewStatus === "REJECTED").length;
  const unpaidOrders = purchaseOrders.filter((po) => !po.paidAt).length;
  const paidOrders = purchaseOrders.filter((po) => po.paidAt).length;

  return {
    session,
    farmer,
    categories,
    purchaseOrders,
    stats: {
      listed: farmer.products.length,
      pendingReviews,
      rejectedProducts,
      unpaidOrders,
      paidOrders,
      openPurchaseOrders: purchaseOrders.filter((po) => !["CANCELLED", "REJECTED", "PAID"].includes(po.status))
        .length,
    },
  };
}
