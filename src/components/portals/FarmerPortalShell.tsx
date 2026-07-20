"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "@/lib/locale-context";
import { locales, localeLabels, type Locale } from "@/lib/i18n";

const CROP_BACKGROUNDS = [
  "/images/hero/hero-crops.jpg",
  "/images/hero/hero-greenhouse.jpg",
  "/images/hero/hero-crops.png",
  "/images/hero/hero-greenhouse.png",
];

/**
 * Private Farmers Portal shell — Youth Huza branding only (not HUZA FRESH shop chrome).
 */
export function FarmerPortalShell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();
  const isLanding = pathname === "/farmer" || pathname === "/farmer/";
  const isAuthScreen =
    pathname === "/farmer/login" ||
    pathname.startsWith("/farmer/login/") ||
    pathname === "/farmer/register" ||
    pathname.startsWith("/farmer/register/");
  const lockViewport = isLanding || isAuthScreen;

  return (
    <div
      className={`farmer-portal relative ${
        lockViewport ? "flex h-dvh flex-col overflow-hidden" : "min-h-screen overflow-x-hidden"
      }`}
    >
      {/* Clear crop atmosphere — readable farm imagery behind the workspace */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0">
          <Image
            src={CROP_BACKGROUNDS[0]}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 farmer-portal-wash" />
        {!isAuthScreen && (
          <>
            <div className="absolute -right-4 top-20 h-72 w-72 overflow-hidden rounded-full border-4 border-white/40 shadow-lg opacity-55 sm:h-96 sm:w-96">
              <Image src={CROP_BACKGROUNDS[1]} alt="" fill className="object-cover" sizes="384px" />
            </div>
            <div className="absolute -left-6 bottom-28 h-80 w-80 overflow-hidden rounded-[2rem] border-4 border-white/40 shadow-lg opacity-50 sm:h-[26rem] sm:w-[26rem]">
              <Image src={CROP_BACKGROUNDS[2]} alt="" fill className="object-cover" sizes="416px" />
            </div>
            <div className="absolute right-[10%] bottom-6 hidden h-56 w-80 overflow-hidden rounded-3xl border-4 border-white/40 shadow-lg opacity-45 lg:block">
              <Image src={CROP_BACKGROUNDS[3]} alt="" fill className="object-cover" sizes="320px" />
            </div>
          </>
        )}
      </div>

      <header className="relative z-20 shrink-0 bg-[var(--huza-green-dark)] shadow-[0_8px_24px_rgba(7,44,27,0.22)]">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 sm:px-6 ${
            isAuthScreen ? "py-2 sm:py-2.5" : "py-2.5 sm:py-3.5"
          }`}
        >
          <Link href="/farmer" className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-white/40">
              <Image
                src="/images/youth-huza-logo.png"
                alt="Youth Huza"
                width={148}
                height={72}
                className={isAuthScreen ? "h-8 w-auto sm:h-10" : "h-9 w-auto sm:h-14"}
                priority
              />
            </span>
            <p className="hidden rounded-lg bg-white px-2.5 py-1.5 text-sm font-bold uppercase tracking-[0.08em] sm:block">
              <span className="text-[#0b5c34]">Youth</span>{" "}
              <span className="text-[var(--huza-orange)]">Huza</span>
            </p>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <select
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label="Language"
            >
              {locales.map((l) => (
                <option key={l} value={l} className="text-[var(--huza-ink)]">
                  {localeLabels[l]}
                </option>
              ))}
            </select>

            {session?.user ? (
              <>
                <span className="hidden max-w-[140px] truncate text-xs text-white/75 sm:inline">
                  {session.user.name}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/farmer/login" })}
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/farmer/login"
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[var(--huza-green-dark)] hover:bg-[var(--huza-mint)]"
              >
                {t("farmerLogin")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={`relative z-10 min-h-0 ${lockViewport ? "flex-1 overflow-hidden" : ""}`}>
        {children}
      </div>

      {!isAuthScreen && (
        <footer
          className={`relative z-10 shrink-0 border-t border-[var(--huza-line)]/70 bg-white/85 text-center text-xs text-[var(--huza-muted)] backdrop-blur-sm ${
            isLanding ? "py-3" : "mt-16 py-6"
          }`}
        >
          <p>
            © {new Date().getFullYear()} Youth Huza · {t("farmerPortal")}. {t("allRightsReserved")}
          </p>
        </footer>
      )}
    </div>
  );
}
