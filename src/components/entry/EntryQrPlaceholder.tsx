"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  caption: string;
  href: string;
  imageSrc: string;
  openLabel: string;
  className?: string;
};

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

/** Scannable QR with click-through to the matching destination. */
export function EntryQrPlaceholder({
  caption,
  href,
  imageSrc,
  openLabel,
  className = "",
}: Props) {
  const external = isExternal(href);
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Link
        href={href}
        {...linkProps}
        className="group relative flex size-40 items-center justify-center overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white p-2 shadow-sm transition hover:border-[var(--huza-green)] hover:shadow-md sm:size-44"
        aria-label={`${caption}: ${openLabel}`}
        title={href}
      >
        <Image
          src={imageSrc}
          alt={caption}
          fill
          className="object-contain p-2 transition group-hover:scale-[1.02]"
          sizes="176px"
          unoptimized
        />
      </Link>
      <p className="text-xs font-semibold text-[var(--huza-muted)]">{caption}</p>
      <Link
        href={href}
        {...linkProps}
        className="text-[11px] font-semibold text-[var(--huza-green-dark)] underline-offset-2 hover:underline"
      >
        {openLabel}
      </Link>
    </div>
  );
}
