import { FarmerWorkspaceShell } from "@/components/portals/FarmerWorkspaceShell";
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
        <div className="mb-5 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] px-4 py-3 text-sm text-[var(--huza-ink)]">
          Your farm account is <strong>{farmer.status}</strong>. You can explore the portal, but product
          submissions unlock after Youth Huza approval.
          {farmer.rejectionReason ? (
            <span className="mt-1 block text-red-700">Reason: {farmer.rejectionReason}</span>
          ) : null}
        </div>
      )}
      {children}
    </FarmerWorkspaceShell>
  );
}
