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

  // Customer storefront nav only — staff portals are not advertised here
  const nav = [
    { href: "/", label: t("home") },
    { href: "/products", label: t("products") },
    { href: "/categories", label: t("categories") },
    { href: "/track", label: t("trackOrder") },
    { href: "/support", label: t("support") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--huza-line)] bg-[rgba(247,251,248,0.92)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="HUZA FRESH">
            <Image src="/logo.svg" alt="Youth Huza" width={40} height={40} priority />
            <div className="hidden sm:block leading-tight">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-green-dark)] tracking-tight">
                HUZA FRESH
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
                {t("poweredBy")}
              </p>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <SmartSearch />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <label className="sr-only" htmlFor="lang">
              {t("language")}
            </label>
            <select
              id="lang"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded-md border border-[var(--huza-line)] bg-white px-2 py-1.5 text-sm"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeFlags[l]} {l.toUpperCase()}
                </option>
              ))}
            </select>

            <Link
              href="/wishlist"
              className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)]"
              aria-label={t("wishlist")}
            >
              <Heart className="size-5" />
            </Link>

            <Link
              href="/track"
              className="hidden sm:inline-flex items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)]"
              aria-label={t("trackOrder")}
            >
              <MapPinned className="size-5" />
            </Link>

            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-[var(--huza-mint)]"
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
              <div className="relative group">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1 rounded-full p-2 hover:bg-[var(--huza-mint)]"
                >
                  <User className="size-5" />
                </Link>
                <div className="invisible group-hover:visible absolute right-0 mt-1 w-44 rounded-lg border border-[var(--huza-line)] bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs text-[var(--huza-muted)] truncate">
                    {session.user.name}
                  </p>
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
                className="hidden sm:inline-flex rounded-full bg-[var(--huza-green)] px-3 py-1.5 text-sm font-semibold text-white"
              >
                {t("login")}
              </Link>
            )}

            <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label={t("menu")}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 pb-3 text-sm font-medium">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "pb-1 border-b-2 border-transparent hover:text-[var(--huza-green)]",
                pathname === item.href && "border-[var(--huza-green)] text-[var(--huza-green-dark)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {open && (
          <div className="md:hidden pb-4 space-y-3">
            <SmartSearch />
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-1 font-medium"
              >
                {item.label}
              </Link>
            ))}
            {!session?.user && (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="inline-flex rounded-full bg-[var(--huza-green)] px-3 py-1.5 text-sm font-semibold text-white"
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
