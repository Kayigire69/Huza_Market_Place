"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Leaf,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sprout,
  Sun,
  Tractor,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";
import {
  DEFAULT_WHATSAPP_URL,
  SUPPORT_PHONE_DISPLAY,
  whatsappPresetUrl,
} from "@/lib/brand-contact";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  { src: "/images/hero/entry-hero-farmers.png", altKey: "flHeroAltFarmers" },
  { src: "/images/hero/hero-crops.jpg", altKey: "flHeroAltCrops" },
  { src: "/images/hero/hero-greenhouse.jpg", altKey: "flHeroAltGreenhouse" },
  { src: "/images/hero/banner-fruits-vegetables.jpg", altKey: "flHeroAltProduce" },
  { src: "/images/hero/banner-seedlings.jpg", altKey: "flHeroAltSeedlings" },
  { src: "/images/hero/hero-goods.jpg", altKey: "flHeroAltCollection" },
  { src: "/images/hero/banner-market-seedlings.jpg", altKey: "flHeroAltNursery" },
  { src: "/images/catalog/avocado-seedlings.jpg", altKey: "flHeroAltOrchard" },
] as const;

const HOW_STEPS = [
  { key: "flStep1", icon: ClipboardList },
  { key: "flStep2", icon: MapPin },
  { key: "flStep3", icon: Sprout },
  { key: "flStep4", icon: Sun },
  { key: "flStep5", icon: Handshake },
] as const;

const GAINS = [
  { key: "flGainMarket", icon: Tractor },
  { key: "flGainAgronomy", icon: Leaf },
  { key: "flGainTraining", icon: BookOpen },
  { key: "flGainHarvest", icon: ClipboardList },
  { key: "flGainFair", icon: Handshake },
  { key: "flGainQuality", icon: ShieldCheck },
] as const;

const CROPS = [
  { emoji: "🥑", key: "flCropAvocados" },
  { emoji: "🥭", key: "flCropMangoes" },
  { emoji: "🍊", key: "flCropOranges" },
  { emoji: "🍋", key: "flCropLemons" },
  { emoji: "🍅", key: "flCropTomatoes" },
  { emoji: "🥬", key: "flCropVegetables" },
  { emoji: "🌶", key: "flCropPeppers" },
  { emoji: "🥕", key: "flCropCarrots" },
] as const;

const AGRONOMY_POINTS = [
  "flAgroVisit",
  "flAgroMonitor",
  "flAgroDisease",
  "flAgroPest",
  "flAgroFertilizer",
  "flAgroHarvest",
  "flAgroAdvice",
] as const;

const TRAINING_POINTS = [
  "flTrainGap",
  "flTrainQuality",
  "flTrainHandling",
  "flTrainMarket",
  "flTrainRecords",
  "flTrainSustainable",
] as const;

const TRUST = [
  { key: "flTrustVisits", icon: MapPin },
  { key: "flTrustTeam", icon: Users },
  { key: "flTrustTalk", icon: MessageCircle },
  { key: "flTrustMarket", icon: Tractor },
  { key: "flTrustQuality", icon: ShieldCheck },
  { key: "flTrustLong", icon: Handshake },
] as const;

function HeroCarousel({ t }: { t: (k: string) => string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let id = 0;
    const tick = () => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    };
    const start = () => {
      window.clearInterval(id);
      id = window.setInterval(tick, 6000);
    };
    const stop = () => window.clearInterval(id);
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Only paint current + previous slide (crossfade) instead of all 8 full-bleed images.
  const prevIndex = (index - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  const visible = [prevIndex, index];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/70 shadow-[0_20px_50px_rgba(7,44,27,0.18)] sm:aspect-[5/4] lg:aspect-square">
      {visible.map((i) => {
        const slide = HERO_SLIDES[i];
        const active = i === index;
        return (
          <div
            key={slide.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out",
              active ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!active}
          >
            <Image
              src={slide.src}
              alt={t(slide.altKey)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 44vw"
              priority={i === 0}
              quality={72}
            />
          </div>
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(7,44,27,0.35)] via-transparent to-transparent" />
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function FarmerLandingPage() {
  const { t } = useLocale();
  const whatsapp = whatsappPresetUrl("farmer", DEFAULT_WHATSAPP_URL);
  const phoneHref = SUPPORT_PHONE_DISPLAY.replace(/\D/g, "");

  return (
    <div className="farmer-landing">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:space-y-14 lg:py-10">
        {/* Hero */}
        <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_16px_40px_rgba(7,44,27,0.12)]">
          <div className="grid items-center gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10">
            <div className="text-center lg:text-left">
              <div className="mx-auto inline-flex rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-[var(--huza-line)] lg:mx-0">
                <Image
                  src="/images/youth-huza-logo.png"
                  alt="Youth Huza"
                  width={200}
                  height={100}
                  className="h-12 w-auto sm:h-14"
                  priority
                />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
                Youth Huza · {t("farmerPortal")}
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-[var(--huza-ink)] sm:text-4xl lg:text-[2.65rem]">
                {t("flHeroTitle")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--huza-muted)] sm:text-base">
                {t("flHeroSubtitle")}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/farmer/register" className="block sm:flex-1 lg:flex-none">
                  <Button size="lg" className="h-12 w-full min-w-[12rem] text-base lg:w-auto">
                    {t("flCtaBecomeFarmer")}
                  </Button>
                </Link>
                <Link href="/farmer/login" className="block sm:flex-1 lg:flex-none">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 w-full min-w-[12rem] text-base lg:w-auto"
                  >
                    {t("farmerLogin")}
                  </Button>
                </Link>
              </div>
            </div>
            <HeroCarousel t={t} />
          </div>
        </section>

        {/* How Youth Huza works */}
        <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)] sm:text-3xl">
            {t("flHowTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[var(--huza-muted)]">
            {t("flHowSubtitle")}
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.key} className="relative flex flex-col items-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--huza-mint)] text-[var(--huza-green-dark)] shadow-sm ring-1 ring-[var(--huza-green)]/25">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--huza-green)]">
                    {t("flStepLabel").replace("{n}", String(i + 1))}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[var(--huza-ink)]">
                    {t(step.key)}
                  </p>
                  {i < HOW_STEPS.length - 1 ? (
                    <span
                      className="mt-3 text-lg font-bold text-[var(--huza-green)] lg:absolute lg:-right-1.5 lg:top-5 lg:mt-0"
                      aria-hidden
                    >
                      <span className="lg:hidden">↓</span>
                      <span className="hidden lg:inline">→</span>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        {/* What you gain */}
        <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)] sm:text-3xl">
            {t("flGainsTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[var(--huza-muted)]">
            {t("flGainsSubtitle")}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAINS.map((g) => {
              const Icon = g.icon;
              return (
                <article
                  key={g.key}
                  className="rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/25 p-5 shadow-sm"
                >
                  <Icon className="size-7 text-[var(--huza-green-dark)]" aria-hidden />
                  <h3 className="mt-3 text-base font-bold text-[var(--huza-ink)]">
                    {t(`${g.key}Title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--huza-muted)]">
                    {t(`${g.key}Body`)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Supported crops */}
        <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)] sm:text-3xl">
            {t("flCropsTitle")}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CROPS.map((c) => (
              <div
                key={c.key}
                className="flex flex-col items-center rounded-2xl border border-[var(--huza-line)] bg-white px-3 py-4 text-center shadow-sm"
              >
                <span className="text-3xl" aria-hidden>
                  {c.emoji}
                </span>
                <p className="mt-2 text-sm font-semibold text-[var(--huza-ink)]">{t(c.key)}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-[var(--huza-muted)]">{t("flCropsExpand")}</p>
        </section>

        {/* Agronomy + Training */}
        <section className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <article className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--huza-mint)] text-[var(--huza-green-dark)]">
              <Leaf className="size-6" aria-hidden />
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)] sm:text-2xl">
              {t("flAgroTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--huza-muted)]">{t("flAgroIntro")}</p>
            <ul className="mt-4 space-y-2.5">
              {AGRONOMY_POINTS.map((k) => (
                <li key={k} className="flex gap-2.5 text-sm text-[var(--huza-ink)]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--huza-mint)] text-[var(--huza-green-dark)]">
              <BookOpen className="size-6" aria-hidden />
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)] sm:text-2xl">
              {t("flTrainTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--huza-muted)]">{t("flTrainIntro")}</p>
            <ul className="mt-4 space-y-2.5">
              {TRAINING_POINTS.map((k) => (
                <li key={k} className="flex gap-2.5 text-sm text-[var(--huza-ink)]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* Trust */}
        <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)] sm:text-3xl">
            {t("flTrustTitle")}
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/30 px-4 py-4"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-[var(--huza-green-dark)]" aria-hidden />
                  <p className="text-sm font-semibold text-[var(--huza-ink)]">{t(item.key)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-md sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
            {t("flContactTitle")}
          </h2>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">{t("flContactSubtitle")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                {t("phone")}
              </p>
              <a
                href={phoneHref ? `tel:+${phoneHref.startsWith("250") ? phoneHref : `250${phoneHref.slice(-9)}`}` : undefined}
                className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-[var(--huza-green-dark)]"
              >
                <Phone className="size-4" aria-hidden />
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
            <div className="rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                {t("flContactWhatsAppLabel")}
              </p>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-[var(--huza-green-dark)]"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  {t("flContactWhatsApp")}
                </a>
              ) : (
                <p className="mt-1 text-sm text-[var(--huza-muted)]">—</p>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                {t("flOfficeLocation")}
              </p>
              <p className="mt-1 inline-flex items-start gap-2 text-sm font-medium text-[var(--huza-ink)]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" aria-hidden />
                {t("flOfficeAddress")}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/20 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                {t("workingHours")}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--huza-ink)]">{t("flOfficeHours")}</p>
            </div>
          </div>
          <div className="mt-6">
            <a href={whatsapp || `mailto:info@youthhuza.rw`}>
              <Button size="lg" className="h-11">
                {t("contactUs")}
              </Button>
            </a>
          </div>
        </section>

        {/* Final CTA */}
        <section className="overflow-hidden rounded-[1.75rem] border border-[var(--huza-green)]/30 bg-gradient-to-br from-[var(--huza-green-dark)] to-[#0a3d24] p-6 text-center shadow-lg sm:p-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white sm:text-3xl">
            {t("flFinalCtaTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">{t("flFinalCtaBody")}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/farmer/register">
              <Button
                size="lg"
                className="h-12 w-full min-w-[12rem] border-0 bg-white text-[var(--huza-green-dark)] hover:bg-[var(--huza-mint)] sm:w-auto"
              >
                {t("flCtaRegister")}
              </Button>
            </Link>
            <Link href="/farmer/login">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full min-w-[12rem] border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              >
                {t("farmerLogin")}
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
