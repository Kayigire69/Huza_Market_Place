import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerApprovalsPage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader
        title="Approval Status"
        subtitle="Account and product quality reviews in one place. Structured quality feedback expands in a later phase."
      />

      <FarmerPanel className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
          Farm account
        </p>
        <p className="mt-1 text-lg font-semibold text-[var(--huza-ink)]">{farmer.status}</p>
        {farmer.rejectionReason ? (
          <p className="mt-2 text-sm text-red-700">Reason: {farmer.rejectionReason}</p>
        ) : null}
        {farmer.adminNotes ? (
          <p className="mt-1 text-sm text-[var(--huza-muted)]">Note: {farmer.adminNotes}</p>
        ) : null}
        {farmer.inspectionScheduledAt ? (
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            Agent visit: {new Date(farmer.inspectionScheduledAt).toLocaleString()}
          </p>
        ) : null}
      </FarmerPanel>

      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="approvals"
      />
    </div>
  );
}
