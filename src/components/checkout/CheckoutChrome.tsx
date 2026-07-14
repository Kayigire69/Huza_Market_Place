"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type ProgressStep = "cart" | "checkout" | "payment" | "done";

const STEPS: { id: ProgressStep; label: string }[] = [
  { id: "cart", label: "Cart" },
  { id: "checkout", label: "Checkout" },
  { id: "payment", label: "Payment" },
  { id: "done", label: "Confirmation" },
];

export function CheckoutHeader({ active }: { active: ProgressStep }) {
  const activeIdx = STEPS.findIndex((s) => s.id === active);

  return (
    <header className="border-b border-[var(--huza-line)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="HUZA FRESH">
          <Image
            src="/youth-huza-emblem.png"
            alt=""
            width={36}
            height={35}
            className="size-8 object-contain"
            aria-hidden
          />
          <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight sm:text-base">
            <span className="text-[var(--huza-green-dark)]">HUZA</span>{" "}
            <span className="text-[#E86B1A]">FRESH</span>
          </span>
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--huza-ink)]">Checkout</p>
          <p className="hidden items-center justify-center gap-1 text-[11px] text-[var(--huza-muted)] sm:flex">
            <Lock className="size-3" aria-hidden />
            Secure checkout
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--huza-mint)] px-2.5 py-1 text-[11px] font-semibold text-[var(--huza-green-dark)] sm:hidden">
          <Lock className="size-3" aria-hidden />
          Secure
        </span>
      </div>

      <nav
        aria-label="Checkout progress"
        className="border-t border-[var(--huza-line)] bg-[var(--huza-cream,#F7FBF8)]"
      >
        <ol className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-4 py-2.5 text-[11px] sm:justify-center sm:gap-6 sm:px-6 sm:text-xs">
          {STEPS.map((step, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            return (
              <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
                {i > 0 && (
                  <span
                    className={cn(
                      "mr-1 hidden h-px w-6 sm:block",
                      done || current ? "bg-[var(--huza-green)]" : "bg-[var(--huza-line)]"
                    )}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                    done && "bg-[var(--huza-green)] text-white",
                    current && "bg-[var(--huza-green-dark)] text-white",
                    !done && !current && "bg-[var(--huza-line)] text-[var(--huza-muted)]"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    current && "text-[var(--huza-green-dark)]",
                    done && "text-[var(--huza-green)]",
                    !done && !current && "text-[var(--huza-muted)]"
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}

export function BackToCart() {
  return (
    <Link
      href="/cart"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--huza-green-dark)] hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to Cart
    </Link>
  );
}

export function CheckoutStepCard({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-[var(--huza-ink)]">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--huza-green-dark)] text-xs font-bold text-white">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
