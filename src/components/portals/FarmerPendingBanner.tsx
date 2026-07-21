"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

export function FarmerPendingBanner({
  status,
  rejectionReason,
}: {
  status: string;
  rejectionReason?: string | null;
}) {
  const { t } = useLocale();
  const isRejected = status === "REJECTED";
  const text = t(isRejected ? "pendingPortalBannerRejected" : "pendingPortalBanner").replace(
    "{status}",
    status
  );

  return (
    <div className="mb-5 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] px-4 py-3 text-sm text-[var(--huza-ink)]">
      <p>{text}</p>
      {rejectionReason ? (
        <span className="mt-1 block text-red-700">
          {t("reasonLabel")} {rejectionReason}
        </span>
      ) : null}
      <p className="mt-2 text-[var(--huza-muted)]">
        {isRejected ? t("pendingBannerRejectedHint") : t("pendingBannerWaitingHint")}
      </p>
      <Link
        href="/farmer/settings"
        className="mt-2 inline-flex font-bold text-[var(--huza-green-dark)] underline"
      >
        {t("pendingBannerOpenSettings")}
      </Link>
    </div>
  );
}
