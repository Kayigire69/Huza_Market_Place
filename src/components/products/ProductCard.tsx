"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useLocale } from "@/lib/locale-context";
import { formatRwf, formatUnit } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Heart, BadgeCheck } from "lucide-react";
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
  images: { url: string }[];
  supplier: {
    id: string;
    businessName: string;
    status?: string;
    isVerified?: boolean;
  };
  category?: { nameEn: string; nameFr: string; nameRw: string; slug: string };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { locale, t } = useLocale();
  const addItem = useCart((s) => s.addItem);
  const { data: session } = useSession();
  const [wish, setWish] = useState(false);
  const name =
    locale === "fr" ? product.nameFr : locale === "rw" ? product.nameRw : product.nameEn;
  const image = product.images[0]?.url ?? "/logo.svg";
  const available = product.stockQty > 0;
  const verified =
    product.supplier.isVerified || product.supplier.status === "APPROVED";

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

  return (
    <article className="group flex flex-col">
      <Link href={`/products/${product.id}`} className="relative block overflow-hidden rounded-2xl">
        <div className="aspect-[4/3] bg-[var(--huza-mint)] relative">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 25vw"
          />
        </div>
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
      </Link>
      <div className="pt-3 flex flex-col flex-1">
        <p className="text-xs uppercase tracking-wide text-[var(--huza-muted)] flex items-center gap-1">
          {product.supplier.businessName}
          {verified && (
            <span title="Verified supplier" className="inline-flex text-[var(--huza-green)]">
              <BadgeCheck className="size-3.5" />
            </span>
          )}
        </p>
        <Link
          href={`/products/${product.id}`}
          className="mt-1 font-semibold text-[var(--huza-ink)] hover:text-[var(--huza-green)]"
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
        {product.availableDistricts && product.availableDistricts.length > 0 && (
          <p className="mt-1 text-[10px] text-[var(--huza-muted)] line-clamp-1">
            Available: {product.availableDistricts.slice(0, 3).join(", ")}
            {product.availableDistricts.length > 3 ? "…" : ""}
          </p>
        )}
        <Button
          className="mt-3 w-full"
          size="sm"
          disabled={!available}
          onClick={() =>
            addItem({
              productId: product.id,
              name,
              price: product.price,
              unit: product.unit,
              imageUrl: image,
              supplierId: product.supplier.id,
              supplierName: product.supplier.businessName,
              stockQty: product.stockQty,
            })
          }
        >
          {t("addToCart")}
        </Button>
      </div>
    </article>
  );
}
