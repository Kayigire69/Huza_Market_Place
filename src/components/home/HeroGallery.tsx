/**
 * Legacy multi-slide gallery — unused on the homepage after Phase 2.
 * Kept so older references do not break; home uses HeroSection instead.
 */
"use client";

import Image from "next/image";

/** @deprecated Prefer `HeroSection` (Phase 2 locked hero). */
export function HeroGallery({
  src = "/images/hero/hero-crops.jpg",
  alt = "Fresh quality-checked produce",
}: {
  src?: string;
  alt?: string;
  slides?: unknown;
  intervalMs?: number;
}) {
  return (
    <div className="relative h-full min-h-[220px] w-full overflow-hidden">
      <Image src={src} alt={alt} fill className="object-cover" sizes="100vw" quality={75} priority />
    </div>
  );
}

export const HERO_SLIDES: { src: string; alt: string; caption: string }[] = [
  {
    src: "/images/hero/hero-crops.jpg",
    alt: "Fresh farm crops and vegetables",
    caption: "Seasonal crops from verified farms",
  },
];
