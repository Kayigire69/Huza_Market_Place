"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "onDark";
  showTagline?: boolean;
};

/** Small leaf that passes through the final H of FRESH. */
function LeafThroughH({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M1.5 11C4 7.5 9.5 2.5 16.5 1.2C12.5 3.8 8.2 8.2 6.5 12.5C5.2 11.6 3.2 11.2 1.5 11Z"
        fill="#2FBE5C"
      />
      <path
        d="M6.2 11.5C8.5 8 12 4.2 16 2"
        stroke="#0B5C34"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function HuzaFreshLogo({
  className,
  size = "md",
  variant = "default",
  showTagline = true,
}: Props) {
  const onDark = variant === "onDark";
  const heights = {
    sm: "h-9 sm:h-10",
    md: "h-10 sm:h-11",
    lg: "h-12",
  }[size];
  const markSize = {
    sm: "size-9 sm:size-10",
    md: "size-10 sm:size-11",
    lg: "size-12",
  }[size];
  const titleSize = {
    sm: "text-[0.95rem] sm:text-[1.1rem]",
    md: "text-[1.1rem] sm:text-[1.25rem]",
    lg: "text-xl",
  }[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", heights, className)}>
      <Image
        src="/youth-huza-emblem.png"
        alt=""
        width={320}
        height={308}
        priority
        className={cn("shrink-0 object-contain", markSize)}
        aria-hidden
      />
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span
          className={cn(
            "inline-flex items-baseline gap-1.5 font-[family-name:var(--font-display)] font-bold tracking-tight",
            titleSize
          )}
        >
          <span className={onDark ? "text-white" : "text-[var(--huza-green-dark)]"}>HUZA</span>
          <span className={cn("relative inline-block", onDark ? "text-[#FDBA74]" : "text-[#E86B1A]")}>
            FRESH
            <LeafThroughH
              className={cn(
                "pointer-events-none absolute right-0 top-0 size-3.5 translate-x-[15%] -translate-y-[40%] sm:size-4",
                onDark && "[&_path:first-child]:fill-[#7ED957]"
              )}
            />
          </span>
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1.5 text-[0.58rem] font-medium sm:text-[0.65rem]",
              onDark ? "text-[#C8E8D4]" : "text-[#3a4a40]"
            )}
          >
            Empowered by Youth Huza
          </span>
        ) : null}
      </span>
    </span>
  );
}
