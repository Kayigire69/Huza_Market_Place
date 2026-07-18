import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { formatRwf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FarmerReportsPage() {
  const { farmer, purchaseOrders, stats } = await requireFarmerWorkspace();

  const paid = purchaseOrders.filter((po) => po.paidAt);
  const rejectedPos = purchaseOrders.filter((po) => po.status === "REJECTED");
  const commissionPaid = paid.filter((po) => po.dealType === "COMMISSION");
  const totalEarnings = paid.reduce((s, po) => s + po.totalAmount, 0);
  const commissionFees = commissionPaid.reduce(
    (s, po) => s + (po.commissionAmount ?? 0),
    0
  );
  const qtySold = paid.reduce((s, po) => s + po.quantity, 0);
  const outstanding = purchaseOrders
    .filter((po) => !po.paidAt && !["CANCELLED", "REJECTED", "DRAFT"].includes(po.status))
    .reduce((s, po) => s + po.totalAmount, 0);

  const approved = stats.approvedProducts;
  const rejected = stats.rejectedProducts;
  const acceptanceRate =
    approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : null;

  return (
    <div>
      <FarmerPageHeader
        title="Reports"
        subtitle={`Business summary for ${farmer.businessName}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            Total earnings
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
            {formatRwf(totalEarnings)}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            Quantity sold
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
            {qtySold.toLocaleString()}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            Commission paid to HUZA
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
            {formatRwf(commissionFees)}
          </p>
        </FarmerPanel>
        <FarmerPanel className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            Outstanding payments
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-amber-900">
            {formatRwf(outstanding)}
          </p>
        </FarmerPanel>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FarmerPanel>
          <h2 className="font-semibold text-[var(--huza-ink)]">Sales reports</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--huza-ink)]">
            <li className="flex justify-between gap-3">
              <span>Products / POs paid</span>
              <strong>{paid.length}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Commission sales settled</span>
              <strong>{commissionPaid.length}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Rejected purchase orders</span>
              <strong>{rejectedPos.length}</strong>
            </li>
          </ul>
        </FarmerPanel>

        <FarmerPanel>
          <h2 className="font-semibold text-[var(--huza-ink)]">Farm performance</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--huza-ink)]">
            <li className="flex justify-between gap-3">
              <span>Products approved</span>
              <strong>{approved}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Products rejected</span>
              <strong>{rejected}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Acceptance rate</span>
              <strong>{acceptanceRate != null ? `${acceptanceRate}%` : "—"}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Purchase frequency (POs)</span>
              <strong>{purchaseOrders.length}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Quality rating (Huza)</span>
              <strong>
                {farmer.ratingAvg > 0 ? `${farmer.ratingAvg.toFixed(1)} / 5` : "Not rated yet"}
              </strong>
            </li>
          </ul>
        </FarmerPanel>
      </div>
    </div>
  );
}
