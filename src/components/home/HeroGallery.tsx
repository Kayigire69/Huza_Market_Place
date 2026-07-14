"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = {
  src: string;
  alt: string;
  caption: string;
};

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    src: "/images/hero/hero-farm.svg",
    alt: "Fresh produce sourced from verified farms",
    caption: "Seasonal crops from verified farms",
  },
  {
    src: "/images/hero/hero-fresh.svg",
    alt: "Fresh everyday shopping with HUZA FRESH",
    caption: "Everyday shopping, farm-fresh quality",
  },
  {
    src: "/images/hero/hero-delivery.svg",
    alt: "Delivery of fresh produce to your door",
    caption: "Fresh delivery to your door",
  },
];

export function HeroGallery({
  slides = DEFAULT_SLIDES,
  intervalMs = 5500,
}: {
  slides?: HeroSlide[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={false}>
      {slides.map((slide, i) => {
        const isActive = i === index;
        const isNear =
          isActive ||
          i === (index + 1) % slides.length ||
          i === (index - 1 + slides.length) % slides.length;
        if (!isNear) return null;
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className={`object-cover ${isActive ? "animate-hero-ken" : ""}`}
              sizes="100vw"
            />
          </div>
        );
      })}
      <div className="absolute inset-0 hero-media-overlay" />
      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2 px-4">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.caption}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-[var(--huza-gold)]" : "w-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
      <p className="absolute bottom-12 left-4 right-4 z-10 text-center text-sm text-white/90 sm:left-auto sm:right-8 sm:text-right animate-rise-delay">
        {slides[index]?.caption}
      </p>
    </div>
  );
}

export const HERO_SLIDES = DEFAULT_SLIDES;
