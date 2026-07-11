"use client";

import { OptimizedImage } from "@/components/media/OptimizedImage";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { useCart } from "@/lib/cart-store";
import { formatRwf, formatUnit } from "@/lib/utils";
import { productDescription, productName, categoryName } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { MessageCircle, Minus, Plus, Share2 } from "lucide-react";
import { pushRecentlyViewed } from "@/lib/recently-viewed";

type Product = {
  id: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionRw: string;
  price: number;
  unit: string;
  stockQty: number;
  reservedQty?: number;
  availability?: string | null;
  isOrganic: boolean;
  ratingAvg: number;
  ratingCount: number;
  location: string | null;
  originDistrict?: string | null;
  nutritionalInfo?: string | null;
  availableDistricts?: string[];
  images: { id: string; url: string; alt: string | null }[];
  /** Internal only — not displayed on storefront */
  supplier?: {
    id: string;
    businessName?: string;
  };
  category: { nameEn: string; nameFr: string; nameRw: string; slug: string };
};

export function ProductDetailClient({ product }: { product: Product }) {
  const { locale, t } = useLocale();
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const name = productName(product, locale);
  const description = productDescription(product, locale);
  const image = product.images[active]?.url ?? "/logo.svg";

  useEffect(() => {
    pushRecentlyViewed({
      id: product.id,
      name,
      price: product.price,
      imageUrl: product.images[0]?.url ?? "/logo.svg",
    });
  }, [product.id, name, product.price, product.images]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(`${name} on HUZA FRESH — ${formatRwf(product.price)}`);

  const available = Math.max(0, product.stockQty - (product.reservedQty || 0));
  const availabilityLabel = useMemo(() => {
    if (product.availability === "COMING_SOON") return "Coming soon";
    if (product.availability === "TEMPORARILY_UNAVAILABLE") return "Temporarily unavailable";
    if (available <= 0 || product.availability === "OUT_OF_STOCK") return t("outOfStock");
    if (available <= 5 || product.availability === "LOW_STOCK") return t("lowStock");
    return t("inStock");
  }, [available, product.availability, t]);

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <div>
        <button
          type="button"
          className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[var(--huza-mint)]"
          onClick={() => setLightbox(true)}
          aria-label="Open image gallery"
        >
          <OptimizedImage src={image} alt={name} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 50vw" />
        </button>
        {product.images.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                  i === active ? "border-[var(--huza-green)]" : "border-transparent"
                }`}
                aria-label={img.alt || `Photo ${i + 1}`}
              >
                <OptimizedImage src={img.url} alt={img.alt ?? name} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
        {product.images.length > 1 && (
          <p className="mt-2 text-xs text-[var(--huza-muted)]">
            Gallery: main, side, packaging &amp; close-up views when provided by Huza.
          </p>
        )}
        {lightbox && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setLightbox(false)}
          >
            <div className="relative h-[min(80vh,640px)] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <OptimizedImage src={image} alt={name} fill className="object-contain" sizes="90vw" />
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm uppercase tracking-wide text-[var(--huza-muted)]">
          {categoryName(product.category, locale)}
          {product.isOrganic ? ` · ${t("organic")}` : ""}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--huza-green-dark)]">
          {name}
        </h1>
        <p className="mt-2 text-sm text-[var(--huza-muted)]">
          ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount} {t("reviews")})
        </p>
        <p className="mt-4 text-3xl font-bold text-[var(--huza-green-dark)]">
          {formatRwf(product.price)}
          <span className="ml-2 text-base font-medium text-[var(--huza-muted)]">
            / {formatUnit(product.unit)}
          </span>
        </p>
        <p className="mt-2 text-sm">
          {t("availability")}: <strong>{availabilityLabel}</strong>
          {available > 0 ? ` · ${product.stockQty} in stock` : ""}
        </p>
        {product.originDistrict && (
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            Origin: <strong className="text-[var(--huza-ink)]">{product.originDistrict}</strong>
          </p>
        )}
        {product.availableDistricts && product.availableDistricts.length > 0 && (
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            Delivery coverage: {product.availableDistricts.join(", ")}
          </p>
        )}

        <div className="mt-6">
          <p className="label">{t("quantity")}</p>
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-[var(--huza-line)] p-2"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-10 text-center font-semibold">{qty}</span>
            <button
              className="rounded-lg border border-[var(--huza-line)] p-2"
              onClick={() => setQty((q) => Math.min(available, q + 1))}
              aria-label="Increase"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <Button
          className="mt-6 w-full sm:w-auto"
          size="lg"
          disabled={product.stockQty <= 0}
          onClick={() =>
            addItem(
              {
                productId: product.id,
                name,
                price: product.price,
                unit: product.unit,
                imageUrl: product.images[0]?.url ?? "/logo.svg",
                supplierId: product.supplier?.id ?? "",
                supplierName: "Youth Huza",
                stockQty: product.stockQty,
              },
              qty
            )
          }
        >
          {t("addToCart")}
        </Button>

        <div className="mt-6">
          <p className="label">{t("share")}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-semibold text-white"
            >
              <Share2 className="size-4" /> Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-3 py-2 text-sm font-semibold text-white"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold text-lg">{t("description")}</h2>
          <p className="mt-2 text-[var(--huza-muted)] leading-relaxed">{description}</p>
        </div>
        {product.nutritionalInfo && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg">Nutritional information</h2>
            <p className="mt-2 text-[var(--huza-muted)] leading-relaxed whitespace-pre-line">
              {product.nutritionalInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
