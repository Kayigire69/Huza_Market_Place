"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit, cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { QualityCheckedBadge } from "@/components/products/QualityCheckedBadge";
import { resolveProductImage } from "@/lib/catalog-images";
import { isPreparedCategory } from "@/lib/prepared-product-meta";
import { useToastStore } from "@/components/ui/Toast";

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

function StarRow({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating || 5)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5 sm:size-4",
            i < value
              ? "fill-[var(--huza-gold)] text-[var(--huza-gold)]"
              : "fill-transparent text-[var(--huza-line)]"
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

function ProductCardInner({
  product,
  variant = "auto",
}: {
  product: ProductCardData;
  /** prepared = juices/salads “Freshly Prepared” look */
  variant?: "auto" | "default" | "prepared";
}) {
  const { locale, t } = useLocale();
  const addItem = useCart((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);
  const [wish, setWish] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const name =
    locale === "fr" ? product.nameFr : locale === "rw" ? product.nameRw : product.nameEn;
  const image = resolveProductImage(product.nameEn, product.images);
  const available = Math.max(0, product.stockQty - (product.reservedQty || 0));
  const out = available <= 0;
  const lowStock = !out && available <= (product.lowStockAt ?? 5);
  const qualityChecked = !product.reviewStatus || product.reviewStatus === "APPROVED";
  const prepared =
    variant === "prepared" ||
    (variant === "auto" && isPreparedCategory(product.category?.slug));

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
      // Cap cart qty on available (stock − reserved), not raw stockQty
      stockQty: available,
    });
    showToast(`✅ ${t("addedToCart")}`);
  };

  return (
    <article
      className={cn(
        "group flex h-full flex-col",
        prepared &&
          "rounded-2xl border border-[var(--huza-line)] bg-gradient-to-b from-[#fffdf8] to-white p-2.5 shadow-[0_6px_20px_rgba(11,92,52,0.08)] ring-1 ring-[var(--huza-gold)]/35 sm:p-3"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          prepared ? "rounded-xl" : "rounded-xl sm:rounded-2xl"
        )}
      >
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

        {prepared ? (
          <span className="absolute left-2 top-2 z-[1] inline-flex items-center gap-1 rounded-full bg-[#F97316] px-2 py-1 text-[10px] font-bold text-white shadow-sm sm:left-3 sm:top-3 sm:text-[11px]">
            {product.category?.slug === "fresh-juices" ? "🥤" : "🥗"} {t("freshTodayBadge")}
          </span>
        ) : (
          <>
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
          </>
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

        <div className="mt-1.5">
          <StarRow rating={product.ratingAvg > 0 ? product.ratingAvg : 5} />
        </div>

        <div className="mt-1.5 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-base font-bold text-[var(--huza-green-dark)] sm:text-lg">
            {formatRwf(product.price)}
          </span>
          <span className="text-xs text-[var(--huza-muted)] sm:text-sm">
            / {formatUnit(product.unit)}
          </span>
        </div>

        <p
          className={`mt-1 text-[11px] sm:text-xs ${lowStock ? "font-medium text-amber-700" : "invisible"}`}
        >
          {t("lowStock")}
        </p>

        <div className="mt-auto pt-2 sm:pt-3">
          <button
            type="button"
            onClick={addToCart}
            disabled={out}
            aria-label={t("addToCart")}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white transition disabled:pointer-events-none disabled:opacity-50",
              prepared
                ? "bg-[#F97316] hover:bg-[#ea580c]"
                : "bg-[var(--huza-green)] hover:bg-[var(--huza-green-dark)]"
            )}
          >
            <ShoppingCart className="size-4" aria-hidden />
            {out ? t("outOfStock") : t("addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
