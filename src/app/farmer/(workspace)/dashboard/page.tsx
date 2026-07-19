import { FarmerDashboardClient } from "@/components/portals/FarmerDashboardClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerDashboardPage() {
  const { farmer, stats, purchaseOrders } = await requireFarmerWorkspace();
  const latestPo = purchaseOrders[0];
  const accountApproved = farmer.status === "APPROVED";
  const hasCrop = stats.listed > 0;

  const workflow = [
    {
      step: "1",
      titleKey: "workflowSubmitTitle",
      bodyKey: "workflowSubmitBody",
      href: "/farmer/products/submit",
      done: hasCrop,
    },
    {
      step: "2",
      titleKey: "workflowApprovalTitle",
      bodyKey: "workflowApprovalBody",
      href: "/farmer/approvals",
      done: stats.approvedProducts > 0 && stats.pendingReviews === 0,
      active: hasCrop && (stats.pendingReviews > 0 || stats.approvedProducts === 0),
    },
    {
      step: "3",
      titleKey: "workflowPoTitle",
      bodyKey: "workflowPoBody",
      href: "/farmer/orders",
      done: stats.openPurchaseOrders > 0 || stats.paidOrders > 0 || stats.unpaidOrders > 0,
      active:
        stats.approvedProducts > 0 && stats.openPurchaseOrders === 0 && stats.paidOrders === 0,
    },
    {
      step: "4",
      titleKey: "workflowPayTitle",
      bodyKey: "workflowPayBody",
      href: "/farmer/payments",
      done: stats.paidOrders > 0,
      active: stats.unpaidOrders > 0,
    },
  ];

  return (
    <FarmerDashboardClient
      data={{
        fullName: farmer.user?.fullName || farmer.businessName,
        businessName: farmer.businessName,
        status: farmer.status,
        isVerified: farmer.isVerified,
        farmingType: farmer.farmingType,
        rejectionReason: farmer.rejectionReason,
        inspectionScheduledAt: farmer.inspectionScheduledAt
          ? farmer.inspectionScheduledAt.toISOString()
          : null,
        accountApproved,
        hasCrop,
        mainCropName: stats.mainCropName,
        primaryUnit: stats.primaryUnit,
        availableVolume: stats.availableVolume,
        pendingReviews: stats.pendingReviews,
        rejectedProducts: stats.rejectedProducts,
        approvedProducts: stats.approvedProducts,
        openPurchaseOrders: stats.openPurchaseOrders,
        unpaidOrders: stats.unpaidOrders,
        paidOrders: stats.paidOrders,
        pendingPayoutAmount: stats.pendingPayoutAmount,
        paidAmount: stats.paidAmount,
        listed: stats.listed,
        latestPo: latestPo
          ? {
              poNumber: latestPo.poNumber,
              totalAmount: latestPo.totalAmount,
              status: latestPo.status,
              paymentStatus: latestPo.paymentStatus,
            }
          : null,
        workflow,
      }}
    />
  );
}
