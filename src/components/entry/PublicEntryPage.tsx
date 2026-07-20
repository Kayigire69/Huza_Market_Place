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

const WHY = [
  { icon: Leaf, title: "Fresh Produce" },
  { icon: Wheat, title: "Reliable Farmers" },
  { icon: Sprout, title: "Agronomy Support" },
  { icon: BadgeCheck, title: "Quality Assurance" },
  { icon: Bike, title: "Fast Delivery" },
  { icon: Cpu, title: "Technology Driven Agriculture" },
] as const;

export function PublicEntryPage() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="min-h-screen bg-[var(--huza-cream)] text-[var(--huza-ink)]">
      {/* SECTION 1 — Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-[var(--huza-line)]/80 bg-[rgba(247,251,248,0.92)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Youth Huza home">
            <Image
              src="/images/youth-huza-logo.png"
              alt="Youth Huza"
              width={160}
              height={52}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Entry navigation">
            <Link
              href={ENTRY_LINKS.about}
              className="hidden px-2 py-1.5 text-sm font-semibold text-[var(--huza-ink)] hover:text-[var(--huza-green-dark)] sm:inline"
            >
              About
            </Link>
            <Link
              href={ENTRY_LINKS.contact}
              className="hidden px-2 py-1.5 text-sm font-semibold text-[var(--huza-ink)] hover:text-[var(--huza-green-dark)] sm:inline"
            >
              Contact
            </Link>

            <label className="sr-only" htmlFor="entry-locale">
              Language
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
              Customer Website
            </Link>
            <Link
              href={ENTRY_LINKS.farmersPortal}
              className="inline-flex h-9 items-center rounded-lg bg-[var(--huza-green)] px-3 text-xs font-bold text-white transition hover:bg-[var(--huza-green-dark)] sm:text-sm"
            >
              Farmers Portal
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* SECTION 2 — Hero */}
        <section className="relative overflow-hidden border-b border-[var(--huza-line)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 20% 0%, #d8f0e0 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, #fff4d6 0%, transparent 50%), linear-gradient(180deg, #f7fbf8 0%, #eef7f1 100%)",
            }}
          />
          <div className="animate-rise relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-28">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--huza-green-dark)]">
              Youth Huza
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,5vw,3.25rem)] font-bold leading-[1.15] tracking-tight text-[var(--huza-green-dark)]">
              Connecting Farmers with Customers Across Rwanda
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--huza-muted)] sm:text-lg">
              Youth Huza connects farmers with reliable markets while providing customers with
              fresh, high-quality agricultural products through technology.
            </p>
          </div>
        </section>

        {/* SECTION 3 — Two Main Service Cards */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <article className="animate-rise flex flex-col rounded-[28px] border border-[var(--huza-line)] bg-white p-7 shadow-[0_12px_40px_rgba(11,92,52,0.08)] sm:p-9">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--huza-mint)] text-[var(--huza-green-dark)]">
                <ShoppingBasket className="size-7" aria-hidden />
              </div>
              <h2 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                Customer Website
              </h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--huza-muted)]">
                Shop fresh fruits, vegetables, juices, salads, seedlings and other quality
                agricultural products.
              </p>
              <Link
                href={ENTRY_LINKS.customerWebsite}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-6 text-sm font-bold text-white transition hover:bg-[var(--huza-green-dark)]"
              >
                Start Shopping
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--huza-line)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-muted)]">
                  Or
                </span>
                <div className="h-px flex-1 bg-[var(--huza-line)]" />
              </div>
              <p className="mb-3 text-center text-sm font-semibold text-[var(--huza-ink)]">
                Scan QR Code
              </p>
              <EntryQrPlaceholder
                caption={ENTRY_QR.customer.caption}
                href={ENTRY_QR.customer.href}
                imageSrc={ENTRY_QR.customer.imageSrc}
              />
            </article>

            <article className="animate-rise-delay flex flex-col rounded-[28px] border border-[var(--huza-line)] bg-white p-7 shadow-[0_12px_40px_rgba(11,92,52,0.08)] sm:p-9">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--huza-mint)] text-[var(--huza-green-dark)]">
                <Sprout className="size-7" aria-hidden />
              </div>
              <h2 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                Farmers Portal
              </h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--huza-muted)]">
                Join Youth Huza to access reliable markets, agronomy support, transparent payments
                and opportunities to grow your farming business.
              </p>
              <Link
                href={ENTRY_LINKS.farmersPortal}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--huza-green-dark)] px-6 text-sm font-bold text-white transition hover:bg-[#084a2a]"
              >
                Join as a Farmer
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--huza-line)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-muted)]">
                  Or
                </span>
                <div className="h-px flex-1 bg-[var(--huza-line)]" />
              </div>
              <p className="mb-3 text-center text-sm font-semibold text-[var(--huza-ink)]">
                Scan QR Code
              </p>
              <EntryQrPlaceholder
                caption={ENTRY_QR.farmers.caption}
                href={ENTRY_QR.farmers.href}
                imageSrc={ENTRY_QR.farmers.imageSrc}
              />
            </article>
          </div>
        </section>

        {/* SECTION 4 — Why Choose Youth Huza */}
        <section className="border-y border-[var(--huza-line)] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)] sm:text-3xl">
              Why Choose Youth Huza
            </h2>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {WHY.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-cream)] p-6 transition hover:border-[var(--huza-green)]"
                >
                  <item.icon className="size-8 text-[var(--huza-green)]" aria-hidden />
                  <p className="mt-4 text-base font-bold text-[var(--huza-ink)]">{item.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SECTION 5 — Mission */}
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <ShieldCheck className="mx-auto size-10 text-[var(--huza-green)]" aria-hidden />
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
            Mission
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--huza-muted)]">
            Our mission is to connect farmers with customers through technology while improving
            agricultural productivity, market access and food security in Rwanda.
          </p>
        </section>

        {/* SECTION 6 — CTA */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-[var(--huza-green-dark)] px-6 py-12 text-center text-white sm:px-10 sm:py-14">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              Ready to Get Started?
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={ENTRY_LINKS.customerWebsite}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-[var(--huza-green-dark)] transition hover:bg-[var(--huza-mint)]"
              >
                Start Shopping
              </Link>
              <Link
                href={ENTRY_LINKS.farmersPortal}
                className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-white/80 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Join as a Farmer
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 7 — Footer */}
      <footer className="border-t border-[var(--huza-line)] bg-[var(--huza-green-dark)] text-[#E8F5EE]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <Image
              src="/images/youth-huza-logo.png"
              alt="Youth Huza"
              width={180}
              height={60}
              className="h-12 w-auto rounded-lg bg-white/95 p-1.5"
            />
            <p className="mt-4 text-sm leading-relaxed text-[#C8E8D4]">
              Connecting farmers and customers across Rwanda through technology.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#C8E8D4]">
              <li>
                <Link href={ENTRY_LINKS.customerWebsite} className="hover:text-white">
                  Customer Website
                </Link>
              </li>
              <li>
                <Link href={ENTRY_LINKS.farmersPortal} className="hover:text-white">
                  Farmers Portal
                </Link>
              </li>
              <li>
                <Link href={ENTRY_LINKS.contact} className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={ENTRY_LINKS.about} className="hover:text-white">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white">Contact</h3>
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
            <p className="mt-4 text-xs text-[#A8D4BC]">Social media links coming soon.</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-[#A8D4BC]">
          © {new Date().getFullYear()} Youth Huza. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
