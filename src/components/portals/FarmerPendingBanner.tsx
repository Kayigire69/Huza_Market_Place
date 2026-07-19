"use client";

import { useLocale } from "@/lib/locale-context";

export function FarmerPendingBanner({
  status,
  rejectionReason,
}: {
  status: string;
  rejectionReason?: string | null;
}) {
  const { t } = useLocale();
  const text = t("pendingPortalBanner").replace("{status}", status);

  return (
    <div className="mb-5 rounded-xl border border-[var(--huza-gold)] bg-[#FFF8E6] px-4 py-3 text-sm text-[var(--huza-ink)]">
      {text}
      {rejectionReason ? (
        <span className="mt-1 block text-red-700">
          {t("reasonLabel")} {rejectionReason}
        </span>
      ) : null}
    </div>
  );
}
