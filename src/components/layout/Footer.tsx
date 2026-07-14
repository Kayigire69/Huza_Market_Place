"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { HuzaFreshLogo } from "@/components/brand/HuzaFreshLogo";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="mt-20 border-t border-[var(--huza-line)] bg-[var(--huza-green-dark)] text-[#E8F5EE]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <HuzaFreshLogo size="md" variant="onDark" />
          <p className="mt-4 text-sm leading-relaxed text-[#C8E8D4]">{t("footerAbout")}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("footerCompany")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <Link href="/about" className="hover:text-white">
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("contact")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("careers")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("footerCustomer")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <Link href="/track" className="hover:text-white">
                {t("trackOrder")}
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-white">
                {t("wishlist")}
              </Link>
            </li>
            <li>
              <Link href="/delivery-info" className="hover:text-white">
                {t("deliveryInfo")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                {t("faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("footerLegal")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <Link href="/privacy" className="hover:text-white">
                {t("privacyPolicy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                {t("termsConditions")}
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-white">
                {t("refundPolicy")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("followUs")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/250788000000"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wide">
          HUZA FRESH
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--huza-gold)]">
          {t("poweredBy")}
        </p>
        <p className="mt-3 text-xs text-[#A8D4B8]">
          © {new Date().getFullYear()} Youth Huza. {t("allRightsReserved")}
        </p>
      </div>
    </footer>
  );
}
