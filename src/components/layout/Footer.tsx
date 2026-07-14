"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="mt-20 border-t border-[var(--huza-line)] bg-[var(--huza-green-dark)] text-[#E8F5EE]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="HUZA FRESH" width={48} height={48} />
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                HUZA FRESH
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--huza-gold)]">
                {t("poweredBy")}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#C8E8D4]">{t("footerAbout")}</p>
          <p className="mt-3 text-sm font-medium text-[var(--huza-gold)]">{t("noMiddleman")}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("aboutUs")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <Link href="/about" className="hover:text-white">
                {t("aboutYouthHuza")}
              </Link>
            </li>
            <li>
              <Link href="/mission" className="hover:text-white">
                {t("ourMission")}
              </Link>
            </li>
            <li>
              <Link href="/vision" className="hover:text-white">
                {t("ourVision")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("contactUs")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                {t("faq")}
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-white">
                {t("support")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("shop")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <Link href="/categories" className="hover:text-white">
                {t("categories")}
              </Link>
            </li>
            <li>
              <Link href="/products?featured=1" className="hover:text-white">
                {t("specialOffers")}
              </Link>
            </li>
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
            <li className="pt-2 text-xs uppercase tracking-wide text-[#A8D4B8]">
              {t("deliveryZones")}
            </li>
            <li>{t("kigali")}</li>
            <li>{t("kamonyi")}</li>
            <li>{t("bugesera")}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">{t("contact")}</h3>
          <ul className="mb-5 space-y-2 text-sm text-[#C8E8D4]">
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" /> +250 788 000 000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" /> hello@youthhuza.rw
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" /> Kigali, Rwanda
            </li>
            <li>{t("hours")}</li>
          </ul>

          <h3 className="mb-3 font-semibold text-white">{t("legal")}</h3>
          <ul className="mb-4 space-y-2 text-sm text-[#C8E8D4]">
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
          <div className="flex flex-wrap gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Instagram
            </a>
            <a
              href="https://wa.me/250788000000"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
            >
              WhatsApp
            </a>
          </div>
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
