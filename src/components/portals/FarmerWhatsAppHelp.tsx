"use client";

import { MessageCircle } from "lucide-react";
import { whatsappPresetUrl } from "@/lib/brand-contact";
import { useLocale } from "@/lib/locale-context";

/**
 * Compact WhatsApp help CTA for Farmers Portal (login, register, agronomy, training).
 */
export function FarmerWhatsAppHelp({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const href = whatsappPresetUrl("farmer");
  if (!href) return null;

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--huza-green-dark)] underline ${className}`}
      >
        <MessageCircle className="size-3.5 shrink-0" aria-hidden />
        {t("whatsappNeedHelpTitle")}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-3 rounded-xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/25 px-3 py-3 text-left transition hover:bg-[var(--huza-mint)]/45 ${className}`}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
        <MessageCircle className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--huza-ink)]">
          {t("whatsappNeedHelpTitle")}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--huza-muted)]">
          {t("whatsappNeedHelpBody")}
        </span>
      </span>
    </a>
  );
}
