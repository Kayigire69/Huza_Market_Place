"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, User, Menu, X, Heart, MapPinned } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { localeFlags, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SmartSearch } from "@/components/layout/SmartSearch";

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const items = useCart((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/", label: t("home") },
    { href: "/products", label: t("products") },
    { href: "/categories", label: t("categories") },
    { href: "/track", label: t("trackOrder") },
    { href: "/support", label: t("support") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--huza-line)] bg-[rgba(247,251,248,0.95)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        {/* Row 1 — brand + actions */}
        <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="HUZA FRESH">
            <Image src="/logo.svg" alt="Youth Huza" width={36} height={36} className="sm:h-10 sm:w-10" priority />
            <div className="min-w-0 leading-tight">
              <p className="font-[family-name:var(--font-display)] text-[0.95rem] font-bold tracking-tight text-[var(--huza-green-dark)] sm:text-lg">
                HUZA FRESH
              </p>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)] sm:block">
                {t("poweredBy")}
              </p>
            </div>
          </Link>

          <div className="mx-auto hidden max-w-xl flex-1 md:flex">
            <SmartSearch />
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
            <label className="sr-only" htmlFor="lang">
              {t("language")}
            </label>
            <select
              id="lang"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="hidden rounded-md border border-[var(--huza-line)] bg-white px-2 py-1.5 text-sm sm:block"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeFlags[l]} {l.toUpperCase()}
                </option>
              ))}
            </select>

            <Link
              href="/wishlist"
              className="relative hidden items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)] sm:inline-flex"
              aria-label={t("wishlist")}
            >
              <Heart className="size-5" />
            </Link>

            <Link
              href="/track"
              className="hidden items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)] sm:inline-flex"
              aria-label={t("trackOrder")}
            >
              <MapPinned className="size-5" />
            </Link>

            <Link
              href="/cart"
              className="relative hidden items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)] md:inline-flex"
              aria-label={t("cart")}
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--huza-gold)] px-1 text-[10px] font-bold text-[var(--huza-ink)]">
                  {count}
                </span>
              )}
            </Link>

            {session?.user ? (
              <div className="relative group hidden sm:block">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1 rounded-full p-2 hover:bg-[var(--huza-mint)]"
                >
                  <User className="size-5" />
                </Link>
                <div className="invisible absolute right-0 mt-1 w-44 rounded-lg border border-[var(--huza-line)] bg-white p-2 shadow-lg group-hover:visible">
                  <p className="truncate px-2 py-1 text-xs text-[var(--huza-muted)]">{session.user.name}</p>
                  <Link href="/account" className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                    {t("account")}
                  </Link>
                  <Link href="/wishlist" className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                    {t("wishlist")}
                  </Link>
                  {session.user.role === "SUPPLIER" && (
                    <Link href="/farmer" className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--huza-mint)]">
                      {t("farmerPortal")}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--huza-mint)]"
                  >
                    {t("logout")}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden rounded-full bg-[var(--huza-green)] px-3 py-1.5 text-sm font-semibold text-white sm:inline-flex"
              >
                {t("login")}
              </Link>
            )}

            <button
              type="button"
              className="p-2 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={t("menu")}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Row 2 — always-visible mobile search (Tuma / Murukali pattern) */}
        <div className="pb-2.5 md:hidden">
          <SmartSearch />
        </div>

        <nav className="hidden items-center gap-6 pb-3 text-sm font-medium md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "border-b-2 border-transparent pb-1 hover:text-[var(--huza-green)]",
                pathname === item.href && "border-[var(--huza-green)] text-[var(--huza-green-dark)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {open && (
          <div className="space-y-1 pb-4 md:hidden">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--huza-line)] bg-white px-3 py-2 text-sm">
              <span className="text-[var(--huza-muted)]">{t("language")}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="rounded-md border border-[var(--huza-line)] bg-white px-2 py-1 text-sm"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {localeFlags[l]} {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2.5 font-medium hover:bg-[var(--huza-mint)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 font-medium hover:bg-[var(--huza-mint)]"
            >
              {t("wishlist")}
            </Link>
            {session?.user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2.5 font-medium hover:bg-[var(--huza-mint)]"
                >
                  {t("account")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full rounded-lg px-2 py-2.5 text-left font-medium hover:bg-[var(--huza-mint)]"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex rounded-full bg-[var(--huza-green)] px-4 py-2 text-sm font-semibold text-white"
              >
                {t("login")}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
