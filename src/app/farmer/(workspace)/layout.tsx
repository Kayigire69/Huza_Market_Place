import { FarmerWorkspaceShell } from "@/components/portals/FarmerWorkspaceShell";
import { FarmerPendingBanner } from "@/components/portals/FarmerPendingBanner";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { farmer, stats } = await requireFarmerWorkspace();

  return (
    <FarmerWorkspaceShell
      businessName={farmer.businessName}
      status={farmer.status}
      isVerified={farmer.isVerified}
      farmingType={farmer.farmingType}
      listed={stats.listed}
      pendingReviews={stats.pendingReviews}
    >
      {farmer.status !== "APPROVED" && (
        <FarmerPendingBanner
          status={farmer.status}
          rejectionReason={farmer.rejectionReason}
        />
      )}
      {children}
    </FarmerWorkspaceShell>
  );
}
