"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { FarmerPanel } from "@/components/portals/FarmerUi";
import {
  FarmerQualityReviewCard,
  defaultQualityRecommendation,
} from "@/components/portals/FarmerQualityReviewCard";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Clock3, XCircle } from "lucide-react";

type ProductImage = { id?: string; url: string; alt?: string | null };

type CropRow = {
  id: string;
  nameEn: string;
  price: number;
  unit: string;
  stockQty: number;
  reviewStatus?: string | null;
  reviewNote?: string | null;
  reviewRecommendation?: string | null;
  reviewedAt?: string | Date | null;
  category?: { nameEn: string } | null;
  images?: ProductImage[];
};

type Filter = "all" | "PENDING" | "APPROVED" | "REJECTED";

function statusMeta(status: string) {
  const s = status || "PENDING";
  if (s === "APPROVED") {
    return {
      label: "Accepted",
      icon: CheckCircle2,
      chip: "bg-[var(--huza-mint)] text-[var(--huza-green-dark)]",
      ring: "border-[var(--huza-green)]/35",
    };
  }
  if (s === "REJECTED") {
    return {
      label: "Needs improvement",
      icon: XCircle,
      chip: "bg-red-50 text-red-800",
      ring: "border-red-200",
    };
  }
  return {
    label: "In review",
    icon: Clock3,
    chip: "bg-amber-50 text-amber-900",
    ring: "border-amber-200",
  };
}

function accountTone(status: string) {
  if (status === "APPROVED") return "border-[var(--huza-green)]/35 bg-[var(--huza-mint)]/40";
  if (status === "REJECTED") return "border-red-200 bg-red-50/70";
  return "border-amber-200 bg-amber-50/70";
}

/**
 * Phase 3 Approval Status — clear account + crop review trackers for sellers.
 */
export function FarmerApprovalsClient({
  account,
  crops,
}: {
  account: {
    businessName: string;
    status: string;
    isVerified: boolean;
    farmingType?: string | null;
    rejectionReason?: string | null;
    adminNotes?: string | null;
    inspectionScheduledAt?: string | null;
  };
  crops: CropRow[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const pending = crops.filter((c) => !c.reviewStatus || c.reviewStatus === "PENDING").length;
    const approved = crops.filter((c) => c.reviewStatus === "APPROVED").length;
    const rejected = crops.filter((c) => c.reviewStatus === "REJECTED").length;
    return { pending, approved, rejected, all: crops.length };
  }, [crops]);

  const visible = useMemo(() => {
    if (filter === "all") return crops;
    if (filter === "PENDING") {
      return crops.filter((c) => !c.reviewStatus || c.reviewStatus === "PENDING");
    }
    return crops.filter((c) => c.reviewStatus === filter);
  }, [crops, filter]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "PENDING", label: "In review", count: counts.pending },
    { key: "APPROVED", label: "Accepted", count: counts.approved },
    { key: "REJECTED", label: "Needs work", count: counts.rejected },
  ];

  return (
    <div className="space-y-5">
      {/* Account approval */}
      <FarmerPanel className={accountTone(account.status)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
              Farm account
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
              {account.businessName}
            </h2>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              {account.farmingType === "STANDARD" ? "Standard seller" : "Organic dossier"} · Account
              status: <strong className="text-[var(--huza-ink)]">{account.status}</strong>
              {account.isVerified ? " · Verified partner" : ""}
            </p>
          </div>
          <Link href="/farmer/profile">
            <Button size="sm" variant="ghost">
              My Profile
            </Button>
          </Link>
        </div>

        {account.status === "APPROVED" ? (
          <p className="mt-3 text-sm text-[var(--huza-green-dark)]">
            Your farm can submit harvests. Keep quantities honest and photos clear for faster crop acceptance.
          </p>
        ) : account.status === "REJECTED" ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-white/80 px-3 py-3 text-sm">
            <p className="font-semibold text-red-800">Account not approved</p>
            {account.rejectionReason ? (
              <p className="mt-1 text-red-700">Reason: {account.rejectionReason}</p>
            ) : null}
            <p className="mt-2 text-[var(--huza-muted)]">
              Update your profile details, then Youth Huza will review again.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-900">
            Youth Huza is reviewing your farm partnership. Crop selling unlocks after account approval.
          </p>
        )}

        {account.adminNotes ? (
          <p className="mt-2 text-sm text-[var(--huza-muted)]">Huza note: {account.adminNotes}</p>
        ) : null}
        {account.inspectionScheduledAt ? (
          <p className="mt-2 text-sm font-medium text-[var(--huza-ink)]">
            Agent visit scheduled: {new Date(account.inspectionScheduledAt).toLocaleString()}
          </p>
        ) : null}
      </FarmerPanel>

      {/* Crop reviews summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "In review", value: counts.pending, tone: "text-amber-800" },
          { label: "Accepted", value: counts.approved, tone: "text-[var(--huza-green-dark)]" },
          { label: "Needs work", value: counts.rejected, tone: "text-red-800" },
        ].map((kpi) => (
          <FarmerPanel key={kpi.label} className="!p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
              {kpi.label}
            </p>
            <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold ${kpi.tone}`}>
              {kpi.value}
            </p>
          </FarmerPanel>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === f.key
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-line)]"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <FarmerPanel className="max-w-2xl">
          <h3 className="font-semibold text-[var(--huza-ink)]">
            {crops.length === 0 ? "No crop submissions yet" : "Nothing in this filter"}
          </h3>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            {crops.length === 0
              ? "Submit your main crop in large quantity. Youth Huza will show acceptance or improvement notes here."
              : "Try another filter to see other review results."}
          </p>
          {crops.length === 0 ? (
            <Link href="/farmer/products/submit" className="mt-4 inline-block">
              <Button className="gap-2">
                Submit my main crop <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
        </FarmerPanel>
      ) : (
        <div className="space-y-4">
          {visible.map((crop) => {
            const status = crop.reviewStatus || "PENDING";
            const meta = statusMeta(status);
            const Icon = meta.icon;
            return (
              <FarmerPanel key={crop.id} className={`border ${meta.ring}`}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-[var(--huza-mint)] sm:h-32 sm:w-32">
                    {crop.images?.[0]?.url ? (
                      <OptimizedImage
                        src={crop.images[0].url}
                        alt={crop.nameEn}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
                          {crop.nameEn}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--huza-muted)]">
                          {crop.category?.nameEn || "Crop"} · {crop.stockQty.toLocaleString()}{" "}
                          {formatUnit(crop.unit)} · {formatRwf(crop.price)}/{formatUnit(crop.unit)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.chip}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>

                    {crop.reviewedAt ? (
                      <p className="mt-2 text-xs text-[var(--huza-muted)]">
                        Reviewed {new Date(crop.reviewedAt).toLocaleString()}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--huza-muted)]">
                        Waiting for Youth Huza quality review.
                      </p>
                    )}

                    {status === "APPROVED" ? (
                      <p className="mt-3 text-sm text-[var(--huza-green-dark)]">
                        This harvest meets Huza standards. Keep available quantity updated for purchase
                        orders.
                      </p>
                    ) : null}

                    {status === "REJECTED" ? (
                      <FarmerQualityReviewCard
                        productName={crop.nameEn}
                        reason={
                          crop.reviewNote ||
                          "This submission did not meet Huza quality standards."
                        }
                        recommendation={
                          crop.reviewRecommendation ||
                          defaultQualityRecommendation(crop.reviewNote || "")
                        }
                      />
                    ) : null}

                    {status === "PENDING" || !crop.reviewStatus ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href="/farmer/products">
                          <Button size="sm" variant="ghost">
                            Update quantity
                          </Button>
                        </Link>
                      </div>
                    ) : null}

                    {status === "APPROVED" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href="/farmer/products">
                          <Button size="sm">Update crop supply</Button>
                        </Link>
                        <Link href="/farmer/orders">
                          <Button size="sm" variant="ghost">
                            View purchase orders
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </FarmerPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
