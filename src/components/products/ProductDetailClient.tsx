"use client";

import { OptimizedImage } from "@/components/media/OptimizedImage";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { useCart } from "@/lib/cart-store";
import { formatRwf, formatUnit, formatHarvestRelative } from "@/lib/utils";
import { productDescription, productName, categoryName } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { MessageCircle, Minus, Plus, Share2, ShoppingCart } from "lucide-react";
import { pushRecentlyViewed } from "@/lib/recently-viewed";
import { productFulfillmentLabel } from "@/lib/delivery-eta";
import { QualityCheckedBadge } from "@/components/products/QualityCheckedBadge";
import { resolveProductImage } from "@/lib/catalog-images";
import { getPreparedMeta } from "@/lib/prepared-product-meta";
import { useToastStore } from "@/components/ui/Toast";

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
  lowStockAt?: number;
  availability?: string | null;
  isOrganic: boolean;
  ratingAvg: number;
  ratingCount: number;
  location: string | null;
  originDistrict?: string | null;
  nutritionalInfo?: string | null;
  reviewStatus?: string | null;
  reviewedAt?: string | Date | null;
  harvestDate?: string | Date | null;
  availableDistricts?: string[];
  images: { id: string; url: string; alt: string | null; isCover?: boolean }[];
  /** Internal only — not displayed on storefront */
  supplier?: {
    id: string;
    businessName?: string;
  };
  category: { nameEn: string; nameFr: string; nameRw: string; slug: string };
};

export function ProductDetailClient({
  product,
  whatsappUrl = "",
}: {
  product: Product;
  whatsappUrl?: string;
}) {
  const { locale, t } = useLocale();
  const addItem = useCart((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);
  const [qty, setQty] = useState(1);
  const coverIdx = Math.max(
    0,
    product.images.findIndex((i) => i.isCover)
  );
  const [active, setActive] = useState(coverIdx >= 0 ? coverIdx : 0);
  const [lightbox, setLightbox] = useState(false);
  const name = productName(product, locale);
  const description = productDescription(product, locale);
  const cover = resolveProductImage(product.nameEn, product.images);
  const image = product.images[active]
    ? resolveProductImage(product.nameEn, [product.images[active]])
    : cover;

  useEffect(() => {
    // Record this customer's real view (local device history → home section)
    pushRecentlyViewed({ id: product.id });
  }, [product.id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(`${name} on HUZA FRESH — ${formatRwf(product.price)}`);

  const available = Math.max(0, product.stockQty - (product.reservedQty || 0));
  const fulfillment = productFulfillmentLabel(
    product.stockQty,
    product.reservedQty || 0,
    "KIGALI",
    undefined,
    product.lowStockAt ?? 5
  );
  const qualityChecked = !product.reviewStatus || product.reviewStatus === "APPROVED";
  const harvestLabel = formatHarvestRelative(product.harvestDate);
  const inspectedLabel = product.reviewedAt
    ? new Date(product.reviewedAt).toLocaleDateString()
    : null;

  const prepared = getPreparedMeta(product);

  const availabilityLabel = useMemo(() => {
    if (product.availability === "COMING_SOON") return "Coming soon";
    if (!fulfillment.inStock || product.availability === "OUT_OF_STOCK") {
      return "Out of Stock";
    }
    if (available <= (product.lowStockAt ?? 5) || product.availability === "LOW_STOCK") {
      return t("lowStock");
    }
    return t("inStock");
  }, [available, fulfillment.inStock, product.availability, product.lowStockAt, t]);

  const waNumber = whatsappUrl.replace(/.*wa\.me\//, "").replace(/\D/g, "");
  const orderViaWhatsApp = () => {
    if (!waNumber) {
      showToast("WhatsApp order will be available once our business number is set.");
      return;
    }
    const message = encodeURIComponent(
      `Hello HUZA,\n\nI would like to order:\n\nProduct:\n${name}\n\nQuantity:\n${qty} ${formatUnit(product.unit)}\n\nPrice:\n${formatRwf(product.price)}/${formatUnit(product.unit)}\n\nPlease help me complete this order.\n\nThank you.`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank", "noopener,noreferrer");
  };

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
        <div className="mt-3 flex flex-wrap gap-2">
          {qualityChecked && <QualityCheckedBadge />}
          {product.isOrganic && (
            <span className="inline-flex items-center rounded-md bg-[var(--huza-mint)] px-2.5 py-1 text-xs font-semibold text-[var(--huza-green-dark)]">
              {t("organic")}
            </span>
          )}
        </div>
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
          {fulfillment.onlyNLeft != null ? ` · Only ${fulfillment.onlyNLeft} units left` : ""}
          {fulfillment.inStock && fulfillment.onlyNLeft == null ? ` · ${available} ready now` : ""}
        </p>
        <div className="mt-4 rounded-xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/40 p-4 text-sm space-y-1">
          <p className="font-semibold text-[var(--huza-green-dark)]">Product traceability</p>
          {product.originDistrict && (
            <p>
              Origin: <strong>{product.originDistrict}</strong>
            </p>
          )}
          {harvestLabel && (
            <p>
              Harvested: <strong>{harvestLabel}</strong>
            </p>
          )}
          {inspectedLabel && (
            <p>
              Inspection date: <strong>{inspectedLabel}</strong>
            </p>
          )}
          {qualityChecked && <p>Quality: <strong>HUZA Verified</strong></p>}
        </div>

        {prepared && (
          <div className="mt-4 rounded-xl border border-[var(--huza-gold)]/50 bg-[#fff9ee] p-4 text-sm space-y-2">
            <p className="font-semibold text-[var(--huza-green-dark)]">
              🥤 {t("freshTodayBadge")} — {t("preparedDetails")}
            </p>
            <p>
              <span className="text-[var(--huza-muted)]">{t("ingredients")}:</span>{" "}
              <strong>{prepared.ingredients}</strong>
            </p>
            <p>
              <span className="text-[var(--huza-muted)]">{t("bottleSize")}:</span>{" "}
              <strong>{prepared.bottleSize}</strong>
            </p>
            <p>
              <span className="text-[var(--huza-muted)]">{t("servingSize")}:</span>{" "}
              <strong>{prepared.servingSize}</strong>
            </p>
            <p>
              <span className="text-[var(--huza-muted)]">{t("storageInstructions")}:</span>{" "}
              <strong>{prepared.storage}</strong>
            </p>
            <p>
              <span className="text-[var(--huza-muted)]">{t("expiryInfo")}:</span>{" "}
              <strong>{prepared.expiry}</strong>
            </p>
          </div>
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
              onClick={() =>
                setQty((q) => Math.min(fulfillment.inStock ? Math.max(available, 1) : 1, q + 1))
              }
              aria-label="Increase"
              disabled={!fulfillment.inStock}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            className="w-full sm:w-auto"
            size="lg"
            disabled={!fulfillment.inStock}
            onClick={() => {
              addItem(
                {
                  productId: product.id,
                  name,
                  price: product.price,
                  unit: product.unit,
                  imageUrl: cover,
                  supplierId: product.supplier?.id ?? "",
                  supplierName: "Youth Huza",
                  stockQty: product.stockQty,
                },
                qty
              );
              showToast(`✅ ${t("addedToCart")}`);
            }}
          >
            <ShoppingCart className="size-5" aria-hidden />
            {fulfillment.inStock ? t("addToCart") : "Out of Stock"}
          </Button>
          {waNumber ? (
            <Button
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebe57] text-white"
              size="lg"
              variant="secondary"
              onClick={orderViaWhatsApp}
            >
              <MessageCircle className="size-4 mr-2 inline" />
              Order via WhatsApp
            </Button>
          ) : null}
        </div>

        <div className="mt-6">
          <p className="label">{t("share")}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
            >
              <MessageCircle className="size-4" /> Share on WhatsApp
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
