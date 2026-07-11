"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { locales, localeLabels, type Locale } from "@/lib/i18n";

/**
 * Private Farmers Portal shell — Youth Huza branding only (not HUZA FRESH shop chrome).
 */
export function FarmerPortalShell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const name = session?.user?.name || "";
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "YH";
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  }, [name]);

  const isRegister = pathname?.startsWith("/farmer/register");

  return (
    <div className="farmer-shell flex min-h-screen text-[var(--huza-ink)]">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[rgba(10,40,24,0.45)] backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`farmer-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="farmer-sidebar-brand flex items-center gap-3 px-5 py-5">
          <Image
            src="/logo.svg"
            alt="Youth Huza"
            width={42}
            height={42}
            className="rounded-full ring-2 ring-white/25 shadow-sm"
            priority
          />
          <div className="min-w-0 leading-tight">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white">
              Youth Huza
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
              {t("farmerPortal")}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-2">
          <p className="farmer-nav-group">{t("farmerPortal")}</p>
          <Link
            href="/farmer"
            onClick={() => setOpen(false)}
            className={`farmer-nav-link ${pathname === "/farmer" ? "is-active" : ""}`}
          >
            <span className="farmer-nav-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{t("farmerPortal")}</span>
          </Link>
          {!session?.user && (
            <>
              <Link
                href="/auth/login?callbackUrl=/farmer"
                onClick={() => setOpen(false)}
                className="farmer-nav-link"
              >
                <span className="farmer-nav-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{t("farmerLogin")}</span>
              </Link>
              <Link
                href="/farmer/register"
                onClick={() => setOpen(false)}
                className={`farmer-nav-link ${isRegister ? "is-active" : ""}`}
              >
                <span className="farmer-nav-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
                <span>{t("newFarmerApplication")}</span>
              </Link>
            </>
          )}
        </nav>

        <div className="space-y-3 px-3 pb-4">
          <label className="farmer-sidebar-select">
            <span className="sr-only">Language</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label="Language"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeLabels[l]}
                </option>
              ))}
            </select>
          </label>

          <div className="farmer-sidebar-footer rounded-2xl px-3.5 py-3">
            <p className="text-xs font-bold tracking-wide text-emerald-50">
              {t("farmersPortalBadge")}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/70">
              © {new Date().getFullYear()} Youth Huza. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="farmer-atmosphere pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <Image
            src="/images/hero/hero-crops.png"
            alt=""
            fill
            className="object-cover object-[center_30%] opacity-[0.22]"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 farmer-portal-wash" />
        </div>

        <header className="farmer-topbar sticky top-0 z-30">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="farmer-icon-btn lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--huza-green-dark)] sm:text-base">
                {t("farmerPortal")}
              </p>
              <p className="hidden text-[11px] text-[var(--huza-muted)] sm:block">
                {t("farmersPortalSellBadge")}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {session?.user ? (
                <>
                  <div className="hidden items-center gap-2.5 sm:flex">
                    <div className="farmer-avatar" aria-hidden>
                      {initials}
                    </div>
                    <div className="max-w-[160px] text-right leading-tight">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--huza-muted)]">
                        {t("farmersPortalBadge")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/farmer" })}
                    className="farmer-logout-btn"
                  >
                    {t("logout")}
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login?callbackUrl=/farmer"
                  className="rounded-xl bg-[var(--huza-green)] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(11,92,52,0.22)] hover:bg-[var(--huza-green-dark)]"
                >
                  {t("farmerLogin")}
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="farmer-main relative z-10 flex-1">{children}</main>

        <footer className="relative z-10 border-t border-[var(--huza-line)]/70 bg-white/80 py-5 text-center text-xs text-[var(--huza-muted)] backdrop-blur-sm">
          <p>
            © {new Date().getFullYear()} Youth Huza · {t("farmerPortal")}. {t("allRightsReserved")}
          </p>
        </footer>
      </div>
    </div>
  );
}
