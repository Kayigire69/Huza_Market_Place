"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Eye, Heart, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

export type ProductCardData = {
  id: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  price: number;
  unit: string;
  stockQty: number;
  isOrganic: boolean;
  ratingAvg: number;
  availableDistricts?: string[];
  originDistrict?: string | null;
  nutritionalInfo?: string | null;
  images: { url: string }[];
  supplier?: { id: string };
  category?: { nameEn: string; nameFr: string; nameRw: string; slug: string };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { locale, t } = useLocale();
  const addItem = useCart((s) => s.addItem);
  const { data: session } = useSession();
  const [wish, setWish] = useState(false);
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
  const image = product.images[0]?.url ?? "/logo.svg";
  const available = product.stockQty > 0;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      window.location.href = "/auth/login";
      return;
    }
    const res = await fetch("/api/wishlist", {
      method: wish ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    if (res.ok) setWish(!wish);
  };

  const addToCart = () =>
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

  return (
    <article className="group flex flex-col">
      <div className="relative block overflow-hidden rounded-2xl">
        <Link href={`/products/${product.id}`}>
          <div className="aspect-[4/3] bg-[var(--huza-mint)] relative">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:768px) 50vw, 25vw"
              unoptimized={image.startsWith("/uploads/")}
            />
          </div>
        </Link>
        {product.isOrganic && (
          <span className="absolute left-3 top-3 bg-[var(--huza-green-dark)] text-white text-xs font-semibold px-2.5 py-1 rounded-md">
            {t("organic")}
          </span>
        )}
        <button
          type="button"
          onClick={toggleWishlist}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
          aria-label="Wishlist"
        >
          <Heart className={`size-4 ${wish ? "fill-red-500 text-red-500" : "text-[var(--huza-ink)]"}`} />
        </button>
        <button
          type="button"
          onClick={() => setQuick(true)}
          className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-semibold shadow hover:bg-white"
        >
          <Eye className="size-3.5" /> Quick view
        </button>
      </div>
      <div className="pt-3 flex flex-col flex-1">
        {categoryName && (
          <p className="text-[10px] uppercase tracking-wide text-[var(--huza-muted)]">{categoryName}</p>
        )}
        <Link
          href={`/products/${product.id}`}
          className="font-semibold text-[var(--huza-ink)] hover:text-[var(--huza-green)]"
        >
          {name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-[var(--huza-green-dark)]">
            {formatRwf(product.price)}
          </span>
          <span className="text-sm text-[var(--huza-muted)]">/ {formatUnit(product.unit)}</span>
        </div>
        <p className="mt-1 text-xs text-[var(--huza-muted)]">
          ★ {product.ratingAvg.toFixed(1)} ·{" "}
          {available
            ? product.stockQty <= 5
              ? t("lowStock")
              : t("inStock")
            : t("outOfStock")}
        </p>
        <Button className="mt-3 w-full" size="sm" disabled={!available} onClick={addToCart}>
          {t("addToCart")}
        </Button>
      </div>

      {quick && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setQuick(false)}>
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-[var(--huza-mint)]"
              onClick={() => setQuick(false)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--huza-mint)]">
                <Image src={image} alt={name} fill className="object-cover" />
              </div>
              <div>
                {categoryName && <p className="text-xs text-[var(--huza-muted)]">{categoryName}</p>}
                <h3 className="font-semibold text-lg">{name}</h3>
                <p className="mt-2 text-xl font-bold text-[var(--huza-green-dark)]">
                  {formatRwf(product.price)}{" "}
                  <span className="text-sm font-medium text-[var(--huza-muted)]">
                    / {formatUnit(product.unit)}
                  </span>
                </p>
                <p className="mt-2 text-sm text-[var(--huza-muted)]">
                  {available ? t("inStock") : t("outOfStock")} · ★ {product.ratingAvg.toFixed(1)}
                </p>
                {product.originDistrict && (
                  <p className="mt-2 text-sm">Origin: {product.originDistrict}</p>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <Button disabled={!available} onClick={() => { addToCart(); setQuick(false); }}>
                    {t("addToCart")}
                  </Button>
                  <Link href={`/products/${product.id}`} className="text-center text-sm font-semibold text-[var(--huza-green)]">
                    Full details →
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
