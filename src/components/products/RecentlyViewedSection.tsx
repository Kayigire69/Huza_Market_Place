"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getRecentlyViewedIds,
  recentlyViewedEventName,
} from "@/lib/recently-viewed";
import { formatRwf } from "@/lib/utils";
import { productName } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

type LiveProduct = {
  id: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  price: number;
  imageUrl: string;
};

export function RecentlyViewedSection() {
  const { locale, t } = useLocale();
  const [items, setItems] = useState<LiveProduct[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const ids = getRecentlyViewedIds();
    if (ids.length === 0) {
      setItems([]);
      setReady(true);
      return;
    }
    try {
      const res = await fetch(`/api/products/recent?ids=${encodeURIComponent(ids.join(","))}`);
      if (!res.ok) {
        setItems([]);
        setReady(true);
        return;
      }
      const data = (await res.json()) as { products: LiveProduct[] };
      setItems(data.products || []);
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const onUpdate = () => void load();
    window.addEventListener(recentlyViewedEventName(), onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      window.removeEventListener(recentlyViewedEventName(), onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, [load]);

  if (!ready || items.length === 0) return null;

  return (
    <section className="mx-auto mb-8 mt-16 max-w-7xl px-4 sm:px-6">
      <h2 className="section-title mb-6">{t("recentlyViewed")}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((p) => {
          const name = productName(p, locale);
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="w-40 shrink-0 overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white"
            >
              <div className="relative aspect-square bg-[var(--huza-mint)]">
                <Image
                  src={p.imageUrl || "/logo.svg"}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-sm font-semibold">{name}</p>
                <p className="text-xs font-bold text-[var(--huza-green-dark)]">
                  {formatRwf(p.price)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
