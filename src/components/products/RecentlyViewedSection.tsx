"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const clientCache = new Map<string, LiveProduct[]>();
let inflightKey: string | null = null;
let inflightPromise: Promise<LiveProduct[]> | null = null;

async function fetchRecentProducts(ids: string[]): Promise<LiveProduct[]> {
  const key = ids.join(",");
  if (!key) return [];

  const cached = clientCache.get(key);
  if (cached) return cached;

  if (inflightKey === key && inflightPromise) {
    return inflightPromise;
  }

  inflightKey = key;
  inflightPromise = fetch(`/api/products/recent?ids=${encodeURIComponent(key)}`)
    .then(async (res) => {
      if (!res.ok) return [];
      const data = (await res.json()) as { products: LiveProduct[] };
      const products = data.products || [];
      clientCache.set(key, products);
      return products;
    })
    .catch(() => [] as LiveProduct[])
    .finally(() => {
      if (inflightKey === key) {
        inflightKey = null;
        inflightPromise = null;
      }
    });

  return inflightPromise;
}

function RecentSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2" aria-hidden>
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div
          key={i}
          className="w-40 shrink-0 overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white"
        >
          <div className="aspect-square animate-pulse bg-[var(--huza-mint)]" />
          <div className="space-y-2 p-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--huza-line)]/70" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--huza-line)]/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentlyViewedSection() {
  const { locale, t } = useLocale();
  const [items, setItems] = useState<LiveProduct[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [ready, setReady] = useState(false);
  const lastKeyRef = useRef("");

  const load = useCallback(async () => {
    const ids = getRecentlyViewedIds();
    const key = ids.join(",");
    if (key === lastKeyRef.current && ready) return;

    if (ids.length === 0) {
      lastKeyRef.current = "";
      setItems([]);
      setPendingCount(0);
      setReady(true);
      return;
    }

    setPendingCount(ids.length);
    const products = await fetchRecentProducts(ids);
    lastKeyRef.current = key;
    setItems(products);
    setPendingCount(0);
    setReady(true);
  }, [ready]);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    if (ids.length > 0) setPendingCount(ids.length);
    void load();
    const onUpdate = () => {
      window.setTimeout(() => void load(), 80);
    };
    window.addEventListener(recentlyViewedEventName(), onUpdate);
    return () => {
      window.removeEventListener(recentlyViewedEventName(), onUpdate);
    };
  }, [load]);

  if (!ready && pendingCount > 0) {
    return (
      <section className="mx-auto mb-8 mt-16 max-w-7xl px-4 sm:px-6" aria-busy="true">
        <h2 className="section-title mb-6">{t("recentlyViewed")}</h2>
        <RecentSkeleton count={pendingCount} />
      </section>
    );
  }

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
