"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { categoryName } from "@/lib/i18n";
import { formatRwf } from "@/lib/utils";
import { ArrowRight, Leaf, Truck, ShieldCheck } from "lucide-react";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
};

type Supplier = {
  id: string;
  businessName: string;
  location: string;
  ratingAvg: number;
  description: string | null;
  isVerified?: boolean;
  status?: string;
};

type Promo = {
  id: string;
  titleEn: string;
  titleFr: string;
  titleRw: string;
  descriptionEn: string | null;
  descriptionFr: string | null;
  descriptionRw: string | null;
  discountPct: number | null;
  freeDelivery: boolean;
  isFlashSale: boolean;
  code: string | null;
};

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  commentEn: string;
  commentFr: string;
  commentRw: string;
  rating: number;
};

export function HomePage({
  featured,
  bestSellers,
  categories,
  suppliers,
  promotions,
  testimonials,
  isOpen,
}: {
  featured: ProductCardData[];
  bestSellers: ProductCardData[];
  categories: Category[];
  suppliers: Supplier[];
  promotions: Promo[];
  testimonials: Testimonial[];
  isOpen: boolean;
}) {
  const { t, locale } = useLocale();

  const promoTitle = (p: Promo) =>
    locale === "fr" ? p.titleFr : locale === "rw" ? p.titleRw : p.titleEn;
  const promoDesc = (p: Promo) =>
    locale === "fr" ? p.descriptionFr : locale === "rw" ? p.descriptionRw : p.descriptionEn;
  const comment = (x: Testimonial) =>
    locale === "fr" ? x.commentFr : locale === "rw" ? x.commentRw : x.commentEn;

  return (
    <div>
      {!isOpen && (
        <div className="bg-[var(--huza-gold)] text-[var(--huza-ink)] text-center text-sm font-medium py-2 px-4">
          {t("closedNotice")}
        </div>
      )}

      <section className="hero-wash text-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="animate-rise">
            <Image
              src="/logo-wordmark.svg"
              alt="Youth Huza — Huza Market Place"
              width={320}
              height={82}
              className="brightness-0 invert mb-6"
              priority
            />
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-xl">
              HUZA MARKETPLACE
            </h1>
            <p className="mt-2 text-lg sm:text-xl text-[var(--huza-gold)] font-semibold tracking-wide">
              Powered by Youth Huza
            </p>
            <p className="mt-5 max-w-lg text-base sm:text-lg text-[#D7F0E1] leading-relaxed">
              {t("tagline")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" variant="secondary">
                  {t("heroCta")} <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/supplier">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/15 border border-white/30"
                >
                  {t("heroSecondary")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative animate-rise-delay hidden sm:block">
            <div className="animate-float rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-white/10 backdrop-blur-sm p-4">
              <div className="grid grid-cols-2 gap-3">
                {featured.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="rounded-xl overflow-hidden bg-white/95 text-[var(--huza-ink)]"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={p.images[0]?.url ?? "/logo.svg"}
                        alt={p.nameEn}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate">{p.nameEn}</p>
                      <p className="text-sm font-bold text-[var(--huza-green-dark)]">
                        {formatRwf(p.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Truck, title: t("noMiddleman"), body: t("fromFarm") },
            { icon: Leaf, title: t("organic"), body: "Fresh produce from approved Rwandan farms" },
            { icon: ShieldCheck, title: "MTN & Airtel", body: "Pay securely with Mobile Money" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 items-start rounded-2xl bg-white/90 border border-[var(--huza-line)] p-4 shadow-sm"
            >
              <item.icon className="size-6 text-[var(--huza-green)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-[var(--huza-muted)] mt-1">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="section-title">{t("categories")}</h2>
          <Link href="/categories" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="snap-start shrink-0 rounded-full border border-[var(--huza-line)] bg-white px-5 py-2.5 text-sm font-semibold hover:border-[var(--huza-green)] hover:text-[var(--huza-green-dark)] transition"
            >
              {categoryName(c, locale)}
            </Link>
          ))}
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
          <h2 className="section-title mb-6">{t("specialOffers")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {promotions.map((p, i) => (
              <div
                key={p.id}
                className={`rounded-2xl p-6 text-white ${
                  i % 2 === 0 ? "bg-[var(--huza-green-dark)]" : "bg-[#166B3F]"
                }`}
              >
                {p.isFlashSale && (
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--huza-gold)]">
                    Flash
                  </span>
                )}
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                  {promoTitle(p)}
                </h3>
                <p className="mt-2 text-sm text-[#C8E8D4]">{promoDesc(p)}</p>
                {p.code && (
                  <p className="mt-4 inline-block rounded-md bg-white/15 px-3 py-1 text-sm font-mono">
                    {p.code}
                    {p.discountPct ? ` · ${p.discountPct}%` : ""}
                    {p.freeDelivery ? " · Free delivery" : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="section-title">{t("featured")}</h2>
          <Link href="/products?featured=1" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="section-title">{t("bestSellers")}</h2>
          <Link href="/products?best=1" className="text-sm font-semibold text-[var(--huza-green)]">
            {t("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <h2 className="section-title mb-6">{t("suppliers")}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-[var(--huza-line)] bg-white/80 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--huza-mint)] text-[var(--huza-green-dark)] font-bold">
                  {s.businessName.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold">
                    {s.businessName}
                    {(s.isVerified || s.status === "APPROVED") && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--huza-green)] font-bold">
                        ✓ Verified
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--huza-muted)]">
                    {s.location} · ★ {s.ratingAvg.toFixed(1)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--huza-muted)] line-clamp-2">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 mb-8">
        <h2 className="section-title mb-6">{t("testimonials")}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((x) => (
            <blockquote
              key={x.id}
              className="rounded-2xl border border-[var(--huza-line)] bg-white/80 p-5"
            >
              <p className="text-[var(--huza-gold)]">{"★".repeat(x.rating)}</p>
              <p className="mt-3 text-sm leading-relaxed">&ldquo;{comment(x)}&rdquo;</p>
              <footer className="mt-4">
                <p className="font-semibold text-sm">{x.name}</p>
                <p className="text-xs text-[var(--huza-muted)]">{x.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <RecentlyViewedSection />
    </div>
  );
}
