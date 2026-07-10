"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Share2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="mt-20 border-t border-[var(--huza-line)] bg-[var(--huza-green-dark)] text-[#E8F5EE]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Youth Huza" width={48} height={48} />
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">YOUTH HUZA</p>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--huza-gold)]">
                Huza Market Place
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#C8E8D4]">{t("footerAbout")}</p>
          <p className="mt-3 text-sm font-medium text-[var(--huza-gold)]">{t("noMiddleman")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-3">{t("contact")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> +250 788 000 000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> hello@youthhuza.rw
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5" /> Kigali, Rwanda
            </li>
            <li>{t("hours")}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-3">{t("deliveryZones")}</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>{t("kigali")}</li>
            <li>{t("kamonyi")}</li>
            <li>{t("bugesera")}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-3">Social</h3>
          <div className="flex gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              aria-label="Instagram"
            >
              Instagram
            </a>
            <a
              href="https://wa.me/250788000000"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              aria-label="Share"
            >
              <Share2 className="size-5" />
            </a>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <Link href="/products" className="hover:text-white">
              {t("products")}
            </Link>
            <Link href="/supplier" className="hover:text-white">
              {t("supplierPortal")}
            </Link>
            <Link href="/auth/register" className="hover:text-white">
              {t("register")}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#A8D4B8]">
        © {new Date().getFullYear()} Youth Huza · Huza Market Place
      </div>
    </footer>
  );
}
