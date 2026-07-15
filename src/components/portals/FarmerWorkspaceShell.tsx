"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { FARMER_NAV_SECTIONS, isFarmerNavActive } from "@/lib/farmer-nav";

type Props = {
  children: React.ReactNode;
  businessName: string;
  status: string;
  isVerified: boolean;
  farmingType?: string | null;
  listed: number;
  pendingReviews?: number;
};

/**
 * Phase 1 Farmers Portal workspace — Youth Huza branded sidebar IA.
 * Selling workflow is primary; Grow better / Account are secondary.
 */
export function FarmerWorkspaceShell({
  children,
  businessName,
  status,
  isVerified,
  farmingType,
  listed,
  pendingReviews = 0,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pathLabel =
    farmingType === "STANDARD" ? "Standard seller" : "Organic dossier";

  const Nav = (
    <nav className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="mb-3 rounded-xl bg-white px-2 py-2">
          <Image
            src="/images/youth-huza-logo.png"
            alt="Youth Huza"
            width={180}
            height={88}
            className="mx-auto h-16 w-auto"
            priority
          />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          Farmers Portal
        </p>
        <p className="mt-2 truncate font-[family-name:var(--font-display)] text-lg font-bold text-white">
          {businessName}
        </p>
        <p className="mt-1 text-xs text-white/70">
          {status}
          {isVerified ? " · Verified" : ""} · {pathLabel}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/10 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/55">Main crops</p>
            <p className="text-sm font-bold text-white">{listed}</p>
          </div>
          <div className="rounded-lg bg-white/10 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/55">In review</p>
            <p className="text-sm font-bold text-white">{pendingReviews}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {FARMER_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            <p
              className={`mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
                section.tone === "selling"
                  ? "text-[#f5c542]"
                  : section.tone === "support"
                    ? "text-[#9fe0b8]"
                    : "text-white/45"
              }`}
            >
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isFarmerNavActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.module}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`farmer-nav-link ${active ? "is-active" : ""}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/50">
        Youth Huza
      </div>
    </nav>
  );

  return (
    <div className="farmer-workspace mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-7xl gap-0 lg:gap-6 lg:px-4 lg:py-6">
      {/* Desktop sidebar */}
      <aside className="farmer-sidebar hidden w-64 shrink-0 overflow-hidden rounded-2xl lg:block">
        {Nav}
      </aside>

      {/* Mobile top strip */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--huza-line)] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--huza-green-dark)] px-3 py-2 text-xs font-semibold text-white"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {FARMER_NAV_SECTIONS.find((s) => s.id === "selling")?.items.map((item) => {
              const active = isFarmerNavActive(pathname, item);
              return (
                <Link
                  key={item.module}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-semibold ${
                    active
                      ? "bg-[var(--huza-green)] text-white"
                      : "bg-[var(--huza-mint)] text-[var(--huza-green-dark)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="farmer-sidebar absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="rounded-lg bg-white px-1.5 py-1">
                <Image
                  src="/images/youth-huza-logo.png"
                  alt="Youth Huza"
                  width={120}
                  height={58}
                  className="h-10 w-auto"
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {Nav}
          </div>
        </div>
      )}

      <main className="farmer-workspace-main min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 lg:rounded-2xl lg:border lg:border-white/70 lg:bg-white/90 lg:p-6 lg:pb-8 lg:shadow-sm lg:backdrop-blur-sm">
        {children}
      </main>
    </div>
  );
}
