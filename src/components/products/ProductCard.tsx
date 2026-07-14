"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { QualityCheckedBadge } from "@/components/products/QualityCheckedBadge";
import { resolveProductImage } from "@/lib/catalog-images";

export type ProductCardData = {
  id: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  price: number;
  unit: string;
  stockQty: number;
  reservedQty?: number;
  lowStockAt?: number;
  isOrganic: boolean;
  ratingAvg: number;
  availableDistricts?: string[];
  originDistrict?: string | null;
  nutritionalInfo?: string | null;
  reviewStatus?: string | null;
  reviewedAt?: Date | string | null;
  harvestDate?: Date | string | null;
  images: { url: string; isCover?: boolean }[];
  supplier?: { id: string };
  category?: { nameEn: string; nameFr: string; nameRw: string; slug: string };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { locale, t } = useLocale();
  const addItem = useCart((s) => s.addItem);
  const [wish, setWish] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const name =
    locale === "fr" ? product.nameFr : locale === "rw" ? product.nameRw : product.nameEn;
  const image = resolveProductImage(product.nameEn, product.images);
  const available = Math.max(0, product.stockQty - (product.reservedQty || 0));
  const out = available <= 0;
  const lowStock = !out && available <= (product.lowStockAt ?? 5);
  const qualityChecked = !product.reviewStatus || product.reviewStatus === "APPROVED";

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishBusy) return;
    setWishBusy(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: wish ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      if (res.ok) setWish(!wish);
    } finally {
      setWishBusy(false);
    }
  };

  const addToCart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (out) return;
    addItem({
      productId: product.id,
      name,
      price: product.price,
      unit: product.unit,
      imageUrl: image,
      supplierId: product.supplier?.id ?? "",
      supplierName: "Youth Huza",
      stockQty: product.stockQty,
    });
  };

  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative aspect-square bg-[var(--huza-mint)]">
            <OptimizedImage
              src={image}
              alt={name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 45vw, 22vw"
            />
            {out && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700 sm:text-xs">
                  {t("outOfStock")}
                </span>
              </div>
            )}
          </div>
        </Link>

        {product.isOrganic && (
          <span className="absolute left-2 top-2 rounded bg-[var(--huza-green-dark)] px-1.5 py-0.5 text-[9px] font-semibold text-white sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-xs">
            {t("organic")}
          </span>
        )}

        {qualityChecked && (
          <span
            className={`absolute hidden sm:block ${product.isOrganic ? "left-3 top-11" : "left-3 top-3"}`}
          >
            <QualityCheckedBadge compact />
          </span>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishBusy}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white disabled:opacity-60 sm:right-3 sm:top-3 sm:p-2"
          aria-label={t("wishlist")}
        >
          <Heart
            className={`size-3.5 sm:size-4 ${wish ? "fill-red-500 text-red-500" : "text-[var(--huza-ink)]"}`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-2 sm:pt-3">
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[var(--huza-ink)] hover:text-[var(--huza-green)] sm:min-h-[2.75rem] sm:text-[0.95rem]"
        >
          {name}
        </Link>

        <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-base font-bold text-[var(--huza-green-dark)] sm:text-lg">
            {formatRwf(product.price)}
          </span>
          <span className="text-xs text-[var(--huza-muted)] sm:text-sm">
            / {formatUnit(product.unit)}
          </span>
        </div>

        {/* Spacer keeps Add to cart rows aligned across the grid */}
        <p
          className={`mt-1 text-[11px] sm:text-xs ${lowStock ? "font-medium text-amber-700" : "invisible"}`}
        >
          {t("lowStock")}
        </p>

        <div className="mt-auto pt-2 sm:pt-3">
          <Button
            className="hidden w-full gap-2 sm:inline-flex"
            size="sm"
            onClick={() => addToCart()}
            disabled={out}
          >
            <ShoppingCart className="size-4" aria-hidden />
            {out ? t("outOfStock") : t("addToCart")}
          </Button>
          <button
            type="button"
            onClick={addToCart}
            disabled={out}
            aria-label={t("addToCart")}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--huza-green)] text-xs font-semibold text-white transition hover:bg-[var(--huza-green-dark)] disabled:pointer-events-none disabled:opacity-50 sm:hidden"
          >
            <ShoppingCart className="size-4" aria-hidden />
            {out ? t("outOfStock") : t("addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
}
