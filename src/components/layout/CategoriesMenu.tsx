"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, LayoutGrid, Menu, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { categoryName } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  imageUrl: string | null;
  productCount: number;
};

type CategoriesMenuProps = {
  /** Desktop dropdown trigger style */
  variant?: "desktop" | "mobile";
  className?: string;
  onNavigate?: () => void;
};

export function CategoriesMenu({
  variant = "desktop",
  className,
  onNavigate,
}: CategoriesMenuProps) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/public/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.categories) setCategories(data.categories);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, categories.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (variant === "desktop" && !rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, variant]);

  useEffect(() => {
    if (variant !== "mobile" || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, variant]);

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  const go = () => {
    setOpen(false);
    onNavigate?.();
  };

  const list = (
    <ul className={cn(variant === "desktop" ? "grid gap-1 p-2 sm:grid-cols-2" : "space-y-1 p-3")}>
      {loading && categories.length === 0 ? (
        <li className="px-3 py-6 text-center text-sm text-[var(--huza-muted)]">…</li>
      ) : null}
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/products?category=${c.slug}`}
            onClick={go}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[var(--huza-mint)]"
          >
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[var(--huza-mint)] ring-1 ring-[var(--huza-line)]">
              {c.imageUrl ? (
                <Image
                  src={c.imageUrl}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[var(--huza-green)]">
                  <LayoutGrid className="size-4" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--huza-ink)]">
                {categoryName(c, locale)}
              </span>
              <span className="block text-xs text-[var(--huza-muted)]">
                {c.productCount} {t("products").toLowerCase()}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-[var(--huza-muted)]" />
          </Link>
        </li>
      ))}
      <li>
        <Link
          href="/categories"
          onClick={go}
          className="mt-1 flex items-center justify-between rounded-xl bg-[var(--huza-mint)]/70 px-3 py-2.5 text-sm font-semibold text-[var(--huza-green-dark)] transition hover:bg-[var(--huza-mint)]"
        >
          {t("allCategories")}
          <ChevronRight className="size-4" />
        </Link>
      </li>
    </ul>
  );

  if (variant === "mobile") {
    return (
      <div className={className}>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 font-medium hover:bg-[var(--huza-mint)]"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(true)}
        >
          <span className="inline-flex items-center gap-2">
            <Menu className="size-4" />
            {t("categories")}
          </span>
          <ChevronRight className="size-4 text-[var(--huza-muted)]" />
        </button>

        {open ? (
          <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby={panelId}>
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label={t("menu")}
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--huza-line)] bg-white px-4 py-3">
                <div>
                  <p id={panelId} className="font-semibold text-[var(--huza-ink)]">
                    {t("shopByCategory")}
                  </p>
                  <p className="text-xs text-[var(--huza-muted)]">{t("shopByCategoryHint")}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-[var(--huza-mint)]"
                  aria-label={t("menu")}
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </button>
              </div>
              {list}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onMouseEnter={() => {
        clearClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--huza-green-dark)] px-3.5 py-1.5 text-white transition hover:bg-[var(--huza-green)]"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Menu className="size-4" />
        {t("categories")}
      </button>

      <div
        id={panelId}
        role="menu"
        className={cn(
          "absolute left-0 top-full z-50 mt-2 w-[min(92vw,28rem)] origin-top-left rounded-2xl border border-[var(--huza-line)] bg-white shadow-xl transition",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="border-b border-[var(--huza-line)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--huza-ink)]">{t("shopByCategory")}</p>
          <p className="text-xs text-[var(--huza-muted)]">{t("shopByCategoryHint")}</p>
        </div>
        {list}
      </div>
    </div>
  );
}
