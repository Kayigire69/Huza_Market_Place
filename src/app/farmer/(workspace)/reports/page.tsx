import { redirect } from "next/navigation";
import { FarmerReportsClient } from "@/components/portals/FarmerReportsClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

/** Composite 0–100 from acceptance, rejected POs, and Huza rating when present. */
function computePerformanceScore(input: {
  acceptanceRate: number | null;
  rejectedPos: number;
  ratingAvg: number;
}) {
  let score = input.acceptanceRate != null ? input.acceptanceRate : 70;
  score -= Math.min(25, input.rejectedPos * 5);
  if (input.ratingAvg > 0) {
    score = Math.round(score * 0.7 + (input.ratingAvg / 5) * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default async function FarmerReportsPage() {
  const { farmer, purchaseOrders, stats, reportTotals } = await requireFarmerWorkspace();
  if (farmer.status !== "APPROVED") {
    redirect("/farmer/dashboard");
  }

  const rejectedPos = purchaseOrders.filter((po) => po.status === "REJECTED");
  const approved = stats.approvedProducts;
  const rejected = stats.rejectedProducts;
  const acceptanceRate =
    approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : null;

  const score =
    acceptanceRate == null
      ? null
      : computePerformanceScore({
          acceptanceRate,
          rejectedPos: reportTotals.rejectedPoCount,
          ratingAvg: farmer.ratingAvg,
        });

  const recentTips = rejectedPos
    .filter((po) => po.rejectionReason || po.recommendation)
    .slice(0, 3)
    .map((po) => ({
      id: po.id,
      productName: po.productName,
      poNumber: po.poNumber,
      rejectionReason: po.rejectionReason,
      recommendation: po.recommendation,
    }));

  return (
    <FarmerReportsClient
      businessName={farmer.businessName}
      ratingAvg={farmer.ratingAvg}
      totalEarnings={reportTotals.totalEarnings}
      qtySold={reportTotals.qtySold}
      commissionFees={reportTotals.commissionFees}
      outstanding={reportTotals.outstanding}
      paidCount={reportTotals.paidCount}
      commissionSettledCount={reportTotals.commissionSettledCount}
      rejectedPoCount={reportTotals.rejectedPoCount}
      poCount={reportTotals.poCount}
      approved={approved}
      rejected={rejected}
      acceptanceRate={acceptanceRate}
      score={score}
      recentTips={recentTips}
    />
  );
}
