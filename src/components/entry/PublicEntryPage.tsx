"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Bike,
  Leaf,
  ShieldCheck,
  Sprout,
  Cpu,
  ShoppingBasket,
  Wheat,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { locales, localeFlags, type Locale } from "@/lib/i18n";
import { ENTRY_LINKS, ENTRY_QR } from "@/lib/entry-links";
import { EntryQrPlaceholder } from "@/components/entry/EntryQrPlaceholder";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/brand-contact";
import { entryCopy } from "@/lib/entry-i18n";

const WHY_ICONS = [Leaf, Wheat, Sprout, BadgeCheck, Bike, Cpu] as const;

function BrandLogo({
  size = "header",
  alt,
}: {
  size?: "header" | "footer";
  alt: string;
}) {
  const isFooter = size === "footer";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[var(--huza-line)]/70 ${
        isFooter ? "p-2" : "px-2.5 py-1.5"
      }`}
    >
      <Image
        src="/images/youth-huza-logo.png"
        alt={alt}
        width={isFooter ? 200 : 176}
        height={isFooter ? 72 : 64}
        className={isFooter ? "h-14 w-auto object-contain" : "h-11 w-auto object-contain sm:h-12"}
        priority={!isFooter}
      />
    </span>
  );
}

export function PublicEntryPage() {
  const { locale, setLocale } = useLocale();
  const t = entryCopy(locale);

  return (
    <div className="min-h-screen bg-[var(--huza-cream)] text-[var(--huza-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--huza-line)]/80 bg-[rgba(247,251,248,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center" aria-label={t.brandHome}>
            <BrandLogo alt={t.brand} />
          </Link>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label={t.navLabel}>
            <Link
              href={ENTRY_LINKS.about}
              className="hidden px-2 py-1.5 text-sm font-semibold text-[var(--huza-ink)] hover:text-[var(--huza-green-dark)] sm:inline"
            >
              {t.about}
            </Link>
            <Link
              href={ENTRY_LINKS.contact}
              className="hidden px-2 py-1.5 text-sm font-semibold text-[var(--huza-ink)] hover:text-[var(--huza-green-dark)] sm:inline"
            >
              {t.contact}
            </Link>

            <label className="sr-only" htmlFor="entry-locale">
              {t.language}
            </label>
            <select
              id="entry-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="h-9 rounded-lg border border-[var(--huza-line)] bg-white px-2 text-xs font-semibold text-[var(--huza-ink)]"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeFlags[l]} {l.toUpperCase()}
                </option>
              ))}
            </select>

            <Link
              href={ENTRY_LINKS.customerWebsite}
              className="inline-flex h-9 items-center rounded-lg border border-[var(--huza-green)] px-3 text-xs font-bold text-[var(--huza-green-dark)] transition hover:bg-[var(--huza-mint)] sm:text-sm"
            >
              {t.customerWebsite}
            </Link>
            <Link
              href={ENTRY_LINKS.farmersPortal}
              className="inline-flex h-9 items-center rounded-lg bg-[var(--huza-green)] px-3 text-xs font-bold text-white transition hover:bg-[var(--huza-green-dark)] sm:text-sm"
            >
              {t.farmersPortal}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[var(--huza-line)] bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:py-14">
            <div className="hero-fade-in order-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--huza-green)]">
                {t.brand}
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.65rem,4.5vw,2.85rem)] font-extrabold leading-[1.12] tracking-tight text-[var(--huza-green-dark)]">
                {t.heroLine1}
                <span className="mt-1 block text-[var(--huza-ink)]">{t.heroLine2}</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--huza-muted)] sm:text-[15px]">
                {t.story}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={ENTRY_LINKS.customerWebsite}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--huza-green-dark)]"
                >
                  {t.startShopping}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href={ENTRY_LINKS.farmersPortal}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--huza-green)] bg-white px-6 text-sm font-semibold text-[var(--huza-green-dark)] transition hover:bg-[var(--huza-mint)]"
                >
                  {t.joinFarmer}
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[var(--huza-ink)] sm:text-xs">
                <li className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-3.5 text-[var(--huza-green)]" aria-hidden />
                  {t.trustQuality}
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Sprout className="size-3.5 text-[var(--huza-green)]" aria-hidden />
                  {t.trustFarmer}
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Bike className="size-3.5 text-[var(--huza-green)]" aria-hidden />
                  {t.trustDelivery}
                </li>
              </ul>
            </div>

            <div className="hero-fade-in order-2 md:justify-self-end md:w-[94%]">
              <div className="relative h-[200px] overflow-hidden rounded-3xl bg-[var(--huza-mint)] shadow-[0_8px_28px_rgba(11,92,52,0.12)] sm:h-[240px] md:h-[320px] lg:h-[360px]">
                <Image
                  src="/images/hero/entry-hero-market.png"
                  alt={t.heroImageAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover object-[center_35%]"
                />
                <span className="pointer-events-none absolute left-3 top-3 z-[2] inline-flex items-center rounded-xl bg-white/95 px-2 py-1.5 shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-2">
                  <Image
                    src="/images/youth-huza-logo.png"
                    alt={t.brand}
                    width={140}
                    height={52}
                    className="h-8 w-auto object-contain sm:h-10"
                    priority
                  />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)] sm:text-3xl">
              {t.chooseTitle}
            </h2>
            <p className="mt-2 text-sm text-[var(--huza-muted)] sm:text-base">{t.chooseSub}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <article className="animate-rise flex flex-col overflow-hidden rounded-[28px] border border-[var(--huza-line)] bg-white shadow-[0_12px_40px_rgba(11,92,52,0.08)]">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/hero/banner-fruits-vegetables.png"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-4 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
                  <ShoppingBasket className="size-3.5" aria-hidden />
                  {t.huzaFresh}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                  {t.customerTitle}
                </h3>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--huza-muted)]">
                  {t.customerBody}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm font-medium text-[var(--huza-ink)]">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-[var(--huza-green)]" aria-hidden />
                    {t.customerB1}
                  </li>
                  <li className="flex items-center gap-2">
                    <Bike className="size-4 text-[var(--huza-green)]" aria-hidden />
                    {t.customerB2}
                  </li>
                  <li className="flex items-center gap-2">
                    <Leaf className="size-4 text-[var(--huza-green)]" aria-hidden />
                    {t.customerB3}
                  </li>
                </ul>
                <Link
                  href={ENTRY_LINKS.customerWebsite}
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-6 text-sm font-bold text-white transition hover:bg-[var(--huza-green-dark)]"
                >
                  {t.startShopping}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--huza-line)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-muted)]">
                    {t.or}
                  </span>
                  <div className="h-px flex-1 bg-[var(--huza-line)]" />
                </div>
                <p className="mb-3 text-center text-sm font-semibold text-[var(--huza-ink)]">
                  {t.scanQr}
                </p>
                <EntryQrPlaceholder
                  caption={t.customerQrCaption}
                  href={ENTRY_LINKS.customerWebsite}
                  imageSrc={ENTRY_QR.customer.imageSrc}
                  openLabel={t.openLink}
                />
              </div>
            </article>

            <article className="animate-rise-delay flex flex-col overflow-hidden rounded-[28px] border border-[var(--huza-line)] bg-white shadow-[0_12px_40px_rgba(11,92,52,0.08)]">
              <div className="relative h-48 sm:h-56">
                <Image
                  src="/images/hero/hero-crops.png"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-[center_40%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-4 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
                  <Sprout className="size-3.5" aria-hidden />
                  {t.farmersPortal}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                  {t.farmerTitle}
                </h3>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--huza-muted)]">
                  {t.farmerBody}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm font-medium text-[var(--huza-ink)]">
                  <li className="flex items-center gap-2">
                    <Sprout className="size-4 text-[var(--huza-green)]" aria-hidden />
                    {t.farmerB1}
                  </li>
                  <li className="flex items-center gap-2">
                    <Wheat className="size-4 text-[var(--huza-green)]" aria-hidden />
                    {t.farmerB2}
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-[var(--huza-green)]" aria-hidden />
                    {t.farmerB3}
                  </li>
                </ul>
                <Link
                  href={ENTRY_LINKS.farmersPortal}
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green-dark)] px-6 text-sm font-bold text-white transition hover:bg-[#084a2a]"
                >
                  {t.joinFarmer}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--huza-line)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-muted)]">
                    {t.or}
                  </span>
                  <div className="h-px flex-1 bg-[var(--huza-line)]" />
                </div>
                <p className="mb-3 text-center text-sm font-semibold text-[var(--huza-ink)]">
                  {t.scanQr}
                </p>
                <EntryQrPlaceholder
                  caption={t.farmerQrCaption}
                  href={ENTRY_LINKS.farmersPortal}
                  imageSrc={ENTRY_QR.farmers.imageSrc}
                  openLabel={t.openLink}
                />
              </div>
            </article>
          </div>
        </section>

        <section className="border-y border-[var(--huza-line)] bg-white">
          <div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-3">
            {[
              { src: "/images/hero/hero-greenhouse.png", label: t.stripGrow },
              { src: "/images/hero/hero-goods.png", label: t.stripStock },
              { src: "/images/hero/hero-delivery-receive.png", label: t.stripDeliver },
            ].map((item) => (
              <div key={item.label} className="relative h-44 overflow-hidden sm:h-52 md:h-56">
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-bold text-white drop-shadow">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--huza-cream)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)] sm:text-3xl">
              {t.whyTitle}
            </h2>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {t.whyItems.map((item, i) => {
                const Icon = WHY_ICONS[i] || Leaf;
                return (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-[var(--huza-line)] bg-white p-6 shadow-sm"
                  >
                    <Icon className="size-8 text-[var(--huza-green)]" aria-hidden />
                    <p className="mt-4 text-base font-bold text-[var(--huza-ink)]">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--huza-muted)]">{item.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-[var(--huza-line)]">
          <div className="absolute inset-0">
            <Image
              src="/images/hero/hero-shoppers.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-25"
            />
            <div className="absolute inset-0 bg-[var(--huza-cream)]/85" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <ShieldCheck className="mx-auto size-10 text-[var(--huza-green)]" aria-hidden />
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
              {t.missionTitle}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[var(--huza-muted)]">{t.missionBody}</p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px]">
            <div className="absolute inset-0">
              <Image
                src="/images/hero/hero-greenhouse.png"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[var(--huza-green-dark)]/88" />
            </div>
            <div className="relative px-6 py-12 text-center text-white sm:px-10 sm:py-16">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
                {t.ctaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-[#C8E8D4]">{t.ctaBody}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={ENTRY_LINKS.customerWebsite}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-[var(--huza-green-dark)] transition hover:bg-[var(--huza-mint)]"
                >
                  {t.startShopping}
                </Link>
                <Link
                  href={ENTRY_LINKS.farmersPortal}
                  className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/80 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {t.joinFarmer}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--huza-line)] bg-[var(--huza-green-dark)] text-[#E8F5EE]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <BrandLogo size="footer" alt={t.brand} />
            <p className="mt-4 text-sm leading-relaxed text-[#C8E8D4]">{t.footerAbout}</p>
          </div>
          <div>
            <h3 className="font-semibold text-white">{t.quickLinks}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#C8E8D4]">
              <li>
                <Link href={ENTRY_LINKS.customerWebsite} className="hover:text-white">
                  {t.customerWebsite}
                </Link>
              </li>
              <li>
                <Link href={ENTRY_LINKS.farmersPortal} className="hover:text-white">
                  {t.farmersPortal}
                </Link>
              </li>
              <li>
                <Link href={ENTRY_LINKS.contact} className="hover:text-white">
                  {t.contact}
                </Link>
              </li>
              <li>
                <Link href={ENTRY_LINKS.about} className="hover:text-white">
                  {t.about}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white">{t.contactTitle}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#C8E8D4]">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              {SUPPORT_PHONE_DISPLAY ? (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" aria-hidden />
                  <span>{SUPPORT_PHONE_DISPLAY}</span>
                </li>
              ) : null}
            </ul>
            <p className="mt-4 text-xs text-[#A8D4BC]">{t.socialSoon}</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-[#A8D4BC]">
          © {new Date().getFullYear()} {t.copyright}
        </div>
      </footer>
    </div>
  );
}
