import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Props = {
  productName: string;
  status?: "Rejected" | "Needs improvement";
  reason: string;
  recommendation: string;
  /** Optional guide deep-link topic */
  guideHref?: string;
  agronomistHref?: string;
  resubmitHref?: string;
};

/**
 * Phase 5. Quality Review Result card.
 * Rejected harvests must teach the farmer what to fix next.
 */
export function FarmerQualityReviewCard({
  productName,
  status = "Rejected",
  reason,
  recommendation,
  guideHref = "/farmer/training?topic=quality-standards",
  agronomistHref = "/farmer/agronomy",
  resubmitHref = "/farmer/produce?tab=submit",
}: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50/90 to-white">
      <div className="border-b border-red-200/80 bg-red-50 px-4 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-800">
          Quality Review Result
        </p>
      </div>
      <div className="space-y-3 px-4 py-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
              Product
            </p>
            <p className="mt-0.5 font-semibold text-[var(--huza-ink)]">{productName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
              Status
            </p>
            <p className="mt-0.5 font-semibold text-red-800">{status}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
            Reason
          </p>
          <p className="mt-0.5 text-[var(--huza-ink)]">{reason}</p>
        </div>
        <div className="rounded-lg border border-[var(--huza-line)] bg-[var(--huza-mint)]/35 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--huza-green-dark)]">
            Recommendation
          </p>
          <p className="mt-0.5 text-[var(--huza-ink)]">{recommendation}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={guideHref}>
            <Button size="sm" variant="ghost">
              Read Guide
            </Button>
          </Link>
          <Link href={agronomistHref}>
            <Button size="sm" variant="ghost">
              Ask Expert
            </Button>
          </Link>
          <Link href={resubmitHref}>
            <Button size="sm">Submit improved harvest</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Fallback recommendations when admin did not type one */
export function defaultQualityRecommendation(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("pesticide") || r.includes("spray") || r.includes("chemical")) {
    return "Wait the recommended number of days after spraying before harvesting, and share spray records with Youth Huza.";
  }
  if (r.includes("photo") || r.includes("image") || r.includes("unclear")) {
    return "Take clear daylight photos of the crop and packaging so Huza can judge freshness and grade.";
  }
  if (r.includes("dirty") || r.includes("clean") || r.includes("soil") || r.includes("mud")) {
    return "Wash and handle produce with clean water and containers before offering it to Huza.";
  }
  if (r.includes("ripe") || r.includes("overripe") || r.includes("maturity") || r.includes("harvest")) {
    return "Harvest at the right maturity window and deliver promptly so quality stays market-ready.";
  }
  if (r.includes("damage") || r.includes("bruise") || r.includes("rot")) {
    return "Sort out damaged fruit or leaves and pack carefully so only sound produce is submitted.";
  }
  return "Improve harvesting, handling, and cleanliness to meet Huza quality standards, then submit again.";
}
