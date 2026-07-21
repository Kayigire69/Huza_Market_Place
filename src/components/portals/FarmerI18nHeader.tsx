"use client";

import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { useLocale } from "@/lib/locale-context";

/** Page title from i18n key — no layout change. */
export function FarmerI18nHeader({ titleKey }: { titleKey: string }) {
  const { t } = useLocale();
  return <FarmerPageHeader title={t(titleKey)} />;
}
