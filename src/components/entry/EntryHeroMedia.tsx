"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ROTATE_MS = 5500;

const SLIDES = [
  {
    id: "market",
    src: "/images/hero/entry-hero-market.png",
    kind: "photo" as const,
  },
  {
    id: "logo",
    src: "/images/hero/entry-hero-logo.png",
    kind: "logo" as const,
  },
] as const;

type Props = {
  marketAlt: string;
  logoAlt: string;
  ariaLabel: string;
};

/** Entry hero media: market photo and Youth Huza logo rotate like the shop hero. */
export function EntryHeroMedia({ marketAlt, logoAlt, ariaLabel }: Props) {
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
      <div className="relative h-[200px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(11,92,52,0.12)] ring-1 ring-[var(--huza-line)]/60 sm:h-[240px] md:h-[320px] lg:h-[360px]">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          const alt = slide.kind === "photo" ? marketAlt : logoAlt;
          return (
            <div
              key={slide.id}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                active ? "opacity-100" : "pointer-events-none opacity-0",
                slide.kind === "logo" && "flex items-center justify-center bg-white p-6 sm:p-10"
              )}
            >
              {slide.kind === "photo" ? (
                <Image
                  src={slide.src}
                  alt={alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover object-[center_35%]"
                />
              ) : (
                <Image
                  src={slide.src}
                  alt={alt}
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
          aria-label={ariaLabel}
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={slide.kind === "photo" ? marketAlt : logoAlt}
              onClick={() => go(i)}
              className={cn(
                "size-2.5 rounded-full border shadow-sm transition-colors",
                i === index
                  ? "border-[var(--huza-green)] bg-[var(--huza-green)]"
                  : "border-white/80 bg-white/80 hover:bg-white",
                slide.kind === "logo" && i !== index && "border-[var(--huza-line)] bg-[var(--huza-mint)]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
