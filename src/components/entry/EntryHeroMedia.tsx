"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ROTATE_MS = 5500;

type HeroSlideCopy = {
  weHelp: string;
  customerLabel: string;
  customerLine: string;
  farmerLabel: string;
  farmerLine: string;
  customerAlt: string;
  farmerAlt: string;
  logoAlt: string;
  ariaLabel: string;
};

type SplitSlide = {
  id: string;
  kind: "split";
  customerSrc: string;
  farmerSrc: string;
  customerObject?: string;
  farmerObject?: string;
};

type LogoSlide = {
  id: string;
  kind: "logo";
  src: string;
};

const SLIDES: readonly (SplitSlide | LogoSlide)[] = [
  {
    id: "audience",
    kind: "split",
    customerSrc: "/images/hero/entry-hero-market.png",
    farmerSrc: "/images/hero/hero-crops.png",
    customerObject: "object-[center_35%]",
    farmerObject: "object-cover object-center",
  },
  {
    id: "logo",
    kind: "logo",
    src: "/images/hero/entry-hero-logo.png",
  },
] as const;

function SplitPanel({
  src,
  alt,
  objectClass,
  weHelp,
  label,
  line,
}: {
  src: string;
  alt: string;
  objectClass?: string;
  weHelp: string;
  label: string;
  line: string;
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 45vw" className={cn("object-cover", objectClass)} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 top-0 z-[1] px-4 py-3 text-white sm:px-5 sm:py-4">
        <p className="text-[11px] font-medium leading-tight sm:text-xs">{weHelp}</p>
        <p className="mt-0.5 font-[family-name:var(--font-display)] text-[clamp(1.35rem,4.5vw,1.85rem)] font-extrabold leading-none tracking-tight">
          {label}
        </p>
        <p className="mt-1 max-w-[16rem] text-[11px] font-medium leading-snug sm:max-w-xs sm:text-xs">{line}</p>
      </div>
    </div>
  );
}

export function EntryHeroMedia({ copy }: { copy: HeroSlideCopy }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  return (
    <div
      className="hero-fade-in order-2 md:justify-self-end md:w-[94%]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[280px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(11,92,52,0.12)] ring-1 ring-[var(--huza-line)]/60 sm:h-[320px] md:h-[380px] lg:h-[420px]">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                active ? "opacity-100" : "pointer-events-none opacity-0",
                slide.kind === "split" ? "flex flex-col" : "flex items-center justify-center bg-white p-6 sm:p-10"
              )}
            >
              {slide.kind === "split" ? (
                <>
                  <SplitPanel
                    src={slide.customerSrc}
                    alt={copy.customerAlt}
                    objectClass={slide.customerObject}
                    weHelp={copy.weHelp}
                    label={copy.customerLabel}
                    line={copy.customerLine}
                  />
                  <SplitPanel
                    src={slide.farmerSrc}
                    alt={copy.farmerAlt}
                    objectClass={slide.farmerObject}
                    weHelp={copy.weHelp}
                    label={copy.farmerLabel}
                    line={copy.farmerLine}
                  />
                </>
              ) : (
                <Image
                  src={slide.src}
                  alt={copy.logoAlt}
                  width={420}
                  height={210}
                  priority={i === 0}
                  className="h-auto w-[72%] max-w-[280px] object-contain sm:max-w-[320px] md:max-w-[360px]"
                />
              )}
            </div>
          );
        })}

        <div
          className="absolute inset-x-0 bottom-3 z-[2] flex items-center justify-center gap-2 sm:bottom-4"
          role="tablist"
          aria-label={copy.ariaLabel}
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={slide.kind === "split" ? copy.customerAlt : copy.logoAlt}
              onClick={() => go(i)}
              className={cn(
                "size-2.5 rounded-full border shadow-sm transition-colors",
                i === index
                  ? "border-[var(--huza-green)] bg-[var(--huza-green)]"
                  : slide.kind === "logo"
                    ? "border-[var(--huza-line)] bg-[var(--huza-mint)] hover:bg-white"
                    : "border-white/80 bg-white/80 hover:bg-white"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
