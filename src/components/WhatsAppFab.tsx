"use client";

import Link from "next/link";
import { Headset, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

/**
 * Single storefront help FAB: WhatsApp + Help Center.
 * Replaces a header Support link (Phase 3 nav plan).
 */
export function WhatsAppFab({
  href = "https://wa.me/250788000000",
}: {
  href?: string;
}) {
  const { t } = useLocale();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!ready) return null;

  return (
    <div className="fixed bottom-[5.5rem] right-4 z-[70] flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {open ? (
        <div className="mb-1 w-52 overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white shadow-xl">
          <p className="border-b border-[var(--huza-line)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
            {t("needHelp")}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-[var(--huza-ink)] transition hover:bg-[#E8F8EE]"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="size-4" />
            </span>
            WhatsApp
          </a>
          <Link
            href="/support"
            className="flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-[var(--huza-ink)] transition hover:bg-[var(--huza-mint)]"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--huza-green)] text-white">
              <Headset className="size-4" />
            </span>
            {t("support")}
          </Link>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("needHelp")}
        className={cn(
          "flex items-center gap-2 rounded-full text-white shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          open
            ? "bg-[var(--huza-ink)] px-3 py-3 focus-visible:outline-[var(--huza-ink)]"
            : "bg-[#25D366] px-3.5 py-3 focus-visible:outline-[#25D366] hover:bg-[#1ebe57] md:size-14 md:justify-center md:px-0 md:py-0"
        )}
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <>
            <MessageCircle className="size-6 md:size-7" />
            <span className="pr-1 text-sm font-semibold md:hidden">{t("needHelp")}</span>
          </>
        )}
      </button>
    </div>
  );
}
