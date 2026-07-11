"use client";

import { useLocale } from "@/lib/locale-context";

/** Shared copyright line for private partner / staff portals. */
export function PortalCopyright({ suffix }: { suffix?: string }) {
  const { t } = useLocale();
  return (
    <p className="mt-10 border-t border-[var(--huza-line)]/70 pt-6 text-center text-xs text-[var(--huza-muted)]">
      © {new Date().getFullYear()} Youth Huza
      {suffix ? ` · ${suffix}` : ""}. {t("allRightsReserved")}
    </p>
  );
}
