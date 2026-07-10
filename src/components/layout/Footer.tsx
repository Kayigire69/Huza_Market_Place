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
              <p className="font-[family-name:var(--font-display)] text-xl font-bold">
                HUZA MARKETPLACE
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--huza-gold)]">
                Powered by Youth Huza
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
          <h3 className="font-semibold text-white mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4]">
            <li>
              <Link href="/about" className="hover:text-white">
                About Youth Huza
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-white">
                Track order
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-white">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/supplier" className="hover:text-white">
                {t("supplierPortal")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-3">Legal & social</h3>
          <ul className="space-y-2 text-sm text-[#C8E8D4] mb-4">
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>{t("deliveryZones")}</li>
            <li>{t("kigali")}</li>
            <li>{t("kamonyi")}</li>
            <li>{t("bugesera")}</li>
          </ul>
          <div className="flex gap-3">
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
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              aria-label="WhatsApp"
            >
              <Share2 className="size-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wide">
          HUZA MARKETPLACE
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--huza-gold)]">
          Powered by Youth Huza
        </p>
        <p className="mt-3 text-xs text-[#A8D4B8]">
          © {new Date().getFullYear()} Youth Huza. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
