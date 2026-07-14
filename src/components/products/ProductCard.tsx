"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit, formatHarvestRelative } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { Eye, Heart, Plus, X } from "lucide-react";
import { useState } from "react";
import { productFulfillmentLabel } from "@/lib/delivery-eta";
import { QualityCheckedBadge } from "@/components/products/QualityCheckedBadge";

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
  const [quick, setQuick] = useState(false);
  const name =
    locale === "fr" ? product.nameFr : locale === "rw" ? product.nameRw : product.nameEn;
  const categoryName = product.category
    ? locale === "fr"
      ? product.category.nameFr
      : locale === "rw"
        ? product.category.nameRw
        : product.category.nameEn
    : null;
  const image =
    product.images.find((i) => i.isCover)?.url ?? product.images[0]?.url ?? "/logo.svg";
  const fulfillment = productFulfillmentLabel(
    product.stockQty,
    product.reservedQty || 0,
    "KIGALI",
    undefined,
    product.lowStockAt ?? 5
  );
  const qualityChecked = !product.reviewStatus || product.reviewStatus === "APPROVED";
  const out = !fulfillment.inStock;

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
    <article className="group flex flex-col">
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

        {/* Quality badge: desktop only — keeps mobile cards clean */}
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
          <Heart className={`size-3.5 sm:size-4 ${wish ? "fill-red-500 text-red-500" : "text-[var(--huza-ink)]"}`} />
        </button>

        {/* Quick view: tablet/desktop only */}
        <button
          type="button"
          onClick={() => setQuick(true)}
          className="absolute bottom-2 right-2 hidden items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-semibold shadow hover:bg-white sm:inline-flex sm:bottom-3 sm:right-3"
        >
          <Eye className="size-3.5" /> {t("quickView")}
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-2 sm:pt-3">
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--huza-ink)] hover:text-[var(--huza-green)] sm:text-[0.95rem]"
        >
          {name}
        </Link>

        <div className="mt-1 flex items-baseline gap-1.5 sm:mt-1.5 sm:gap-2">
          <span className="text-base font-bold text-[var(--huza-green-dark)] sm:text-lg">
            {formatRwf(product.price)}
          </span>
          <span className="text-xs text-[var(--huza-muted)] sm:text-sm">
            / {formatUnit(product.unit)}
          </span>
        </div>

        {/* Rating + ETA: desktop only */}
        <p className="mt-1 hidden text-xs text-[var(--huza-muted)] sm:block">
          ★ {product.ratingAvg.toFixed(1)}
          {fulfillment.inStock && (
            <>
              {" · "}
              <span className="font-medium text-[var(--huza-green-dark)]">
                {t("arrivesIn")} {fulfillment.etaLabel}
              </span>
            </>
          )}
          {fulfillment.stockStatus === "LOW_STOCK" && (
            <span className="font-semibold text-amber-700"> · {t("lowStock")}</span>
          )}
        </p>

        {/* Mobile: compact add; Desktop: full-width button */}
        <div className="mt-2 flex items-center gap-2 sm:mt-3">
          <Button
            className="hidden w-full sm:inline-flex"
            size="sm"
            onClick={() => addToCart()}
            disabled={out}
          >
            {out ? t("outOfStock") : t("addToCart")}
          </Button>
          <button
            type="button"
            onClick={addToCart}
            disabled={out}
            aria-label={t("addToCart")}
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-[var(--huza-green)] text-xs font-semibold text-white transition hover:bg-[var(--huza-green-dark)] disabled:pointer-events-none disabled:opacity-50 sm:hidden"
          >
            <Plus className="size-4" aria-hidden />
            {out ? t("outOfStock") : t("addToCart")}
          </button>
        </div>
      </div>

      {quick && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setQuick(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-[var(--huza-mint)]"
              onClick={() => setQuick(false)}
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--huza-mint)]">
                <OptimizedImage src={image} alt={name} fill className="object-cover" sizes="80vw" />
              </div>
              <div>
                {categoryName && <p className="text-xs text-[var(--huza-muted)]">{categoryName}</p>}
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="mt-2 text-xl font-bold text-[var(--huza-green-dark)]">
                  {formatRwf(product.price)}{" "}
                  <span className="text-sm font-medium text-[var(--huza-muted)]">
                    / {formatUnit(product.unit)}
                  </span>
                </p>
                <p className="mt-2 text-sm text-[var(--huza-muted)]">
                  {fulfillment.stockLabel}
                  {fulfillment.onlyNLeft != null ? ` · Only ${fulfillment.onlyNLeft} left` : ""} · ★{" "}
                  {product.ratingAvg.toFixed(1)}
                </p>
                {fulfillment.inStock && (
                  <p className="mt-1 text-sm font-medium text-[var(--huza-green-dark)]">
                    {t("arrivesIn")} {fulfillment.etaLabel}
                  </p>
                )}
                {qualityChecked && (
                  <div className="mt-2">
                    <QualityCheckedBadge />
                  </div>
                )}
                {product.originDistrict && (
                  <p className="mt-2 text-sm">Origin: {product.originDistrict}</p>
                )}
                {formatHarvestRelative(product.harvestDate) && (
                  <p className="mt-1 text-sm text-[var(--huza-muted)]">
                    Harvested: {formatHarvestRelative(product.harvestDate)}
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    disabled={out}
                    onClick={() => {
                      addToCart();
                      setQuick(false);
                    }}
                  >
                    {out ? t("outOfStock") : t("addToCart")}
                  </Button>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-center text-sm font-semibold text-[var(--huza-green)]"
                  >
                    {t("fullDetails")} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
