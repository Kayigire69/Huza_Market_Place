"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";
import { formatRwf } from "@/lib/utils";

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16 mb-8">
      <h2 className="section-title mb-6">Recently viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="w-40 shrink-0 rounded-2xl border border-[var(--huza-line)] bg-white overflow-hidden"
          >
            <div className="relative aspect-square bg-[var(--huza-mint)]">
              <Image src={p.imageUrl || "/logo.svg"} alt={p.name} fill className="object-cover" />
            </div>
            <div className="p-2">
              <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
              <p className="text-xs font-bold text-[var(--huza-green-dark)]">{formatRwf(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
