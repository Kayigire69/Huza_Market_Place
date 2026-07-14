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
    src: "/images/hero/hero-crops.jpg",
    alt: "Fresh farm crops and vegetables",
    caption: "Seasonal crops from verified farms",
  },
  {
    src: "/images/hero/hero-shoppers.jpg",
    alt: "Shoppers with a cart of fresh produce",
    caption: "Everyday shopping, farm-fresh quality",
  },
  {
    src: "/images/hero/hero-greenhouse.jpg",
    alt: "Greenhouse filled with growing crops",
    caption: "Greenhouses growing Huza stock",
  },
  {
    src: "/images/hero/hero-delivery-receive.jpg",
    alt: "Customer receiving a fresh produce delivery",
    caption: "Fresh delivery to your door",
  },
  {
    src: "/images/hero/hero-mobile-payment.jpg",
    alt: "Customers paying with mobile money on a phone",
    caption: "Pay easily with mobile money",
  },
  {
    src: "/images/hero/hero-fresh-store.jpg",
    alt: "Shoppers in a store of fresh products",
    caption: "A full hall of fresh products",
  },
];

export function HeroGallery({
  slides = DEFAULT_SLIDES,
  intervalMs = 6500,
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

  const active = slides[index];

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={false}>
      {/* Only mount active + neighbors to keep home light */}
      {slides.map((slide, i) => {
        const near =
          i === index ||
          i === (index + 1) % slides.length ||
          i === (index - 1 + slides.length) % slides.length;
        if (!near) return null;
        const isActive = i === index;
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
              quality={75}
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
      <p className="absolute bottom-12 left-4 right-4 z-10 text-center text-sm text-white/90 sm:left-auto sm:right-8 sm:text-right">
        {active?.caption}
      </p>
    </div>
  );
}

export const HERO_SLIDES = DEFAULT_SLIDES;
