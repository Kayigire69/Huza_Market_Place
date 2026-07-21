"use client";

import { FarmerPanel } from "@/components/portals/FarmerUi";
import { useLocale } from "@/lib/locale-context";

export function FarmerNotificationsEmpty() {
  const { t } = useLocale();
  return (
    <FarmerPanel className="max-w-2xl">
      <p className="text-sm text-[var(--huza-muted)]">{t("foNotifEmpty")}</p>
    </FarmerPanel>
  );
}
