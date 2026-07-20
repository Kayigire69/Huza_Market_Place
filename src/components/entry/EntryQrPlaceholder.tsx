"use client";

import Image from "next/image";
import { QrCode } from "lucide-react";

type Props = {
  caption: string;
  href: string;
  imageSrc?: string | null;
  className?: string;
};

/**
 * Placeholder QR block. Replace imageSrc in entry-links.ts with the official asset.
 */
export function EntryQrPlaceholder({ caption, href, imageSrc, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="relative flex size-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--huza-line)] bg-white shadow-sm sm:size-40"
        title={href}
        aria-label={`${caption}: ${href}`}
      >
        {imageSrc ? (
          <Image src={imageSrc} alt={caption} fill className="object-contain p-2" sizes="160px" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center">
            <QrCode className="size-14 text-[var(--huza-green-dark)]/35" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
              QR placeholder
            </span>
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-[var(--huza-muted)]">{caption}</p>
    </div>
  );
}
