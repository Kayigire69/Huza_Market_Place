import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { formatRwf } from "@/lib/utils";

export const dynamic = "force-dynamic";

function performanceBand(score: number) {
  if (score >= 85) return { label: "Excellent", hint: "Keep this quality — Huza will prioritize your harvest." };
  if (score >= 70) return { label: "Good", hint: "Solid partner. Small quality wins lift your score further." };
  if (score >= 50) return { label: "Needs work", hint: "Review rejection tips and training guides before next submit." };
  return { label: "At risk", hint: "Ask an agronomist and read quality standards before the next harvest." };
}

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

  const rejectedPos = purchaseOrders.filter((po) => po.status === "REJECTED");
  const totalEarnings = reportTotals.totalEarnings;
  const commissionFees = reportTotals.commissionFees;
  const qtySold = reportTotals.qtySold;
  const outstanding = reportTotals.outstanding;

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
  const band = score != null ? performanceBand(score) : null;
  const recentTips = rejectedPos
    .filter((po) => po.rejectionReason || po.recommendation)
    .slice(0, 3);

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
              <strong>{reportTotals.paidCount}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Commission sales settled</span>
              <strong>{reportTotals.commissionSettledCount}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Rejected purchase orders</span>
              <strong>{reportTotals.rejectedPoCount}</strong>
            </li>
          </ul>
        </FarmerPanel>

        <FarmerPanel>
          <h2 className="font-semibold text-[var(--huza-ink)]">Farm performance score</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--huza-green-dark)]">
              {score != null ? score : "—"}
              <span className="ml-1 text-base font-semibold text-[var(--huza-muted)]">/ 100</span>
            </p>
            {band ? (
              <span className="rounded-lg bg-[var(--huza-mint)] px-2.5 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
                {band.label}
              </span>
            ) : (
              <span className="rounded-lg bg-[var(--huza-mint)] px-2.5 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
                Not scored yet
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            {band?.hint ??
              "Submit produce for HUZA review to unlock your farm performance score."}
          </p>
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
              <strong>{reportTotals.poCount}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Quality rating (Huza)</span>
              <strong>
                {farmer.ratingAvg > 0 ? `${farmer.ratingAvg.toFixed(1)} / 5` : "Not rated yet"}
              </strong>
            </li>
          </ul>
          {recentTips.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-[var(--huza-line)] pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                Recent quality tips
              </p>
              {recentTips.map((po) => (
                <p key={po.id} className="text-sm text-[var(--huza-ink)]">
                  <strong>{po.productName || po.poNumber}:</strong>{" "}
                  {po.recommendation || po.rejectionReason}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/farmer/training?topic=quality-standards"
              className="inline-flex rounded-xl bg-[var(--huza-green)] px-3 py-2 text-sm font-bold text-white"
            >
              Improve quality
            </Link>
            <Link
              href="/farmer/agronomy"
              className="inline-flex rounded-xl border border-[var(--huza-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--huza-ink)]"
            >
              Ask an agronomist
            </Link>
          </div>
        </FarmerPanel>
      </div>
    </div>
  );
}
