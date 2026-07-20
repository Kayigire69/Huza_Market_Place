"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Img = {
  id?: string;
  url: string;
  kind?: string;
  isCover?: boolean;
};

/**
 * HUZA storefront image manager.
 * Farmer inspection photos stay separate. Only STOREFRONT images appear on the shop.
 */
export function AdminProductImages({
  productId,
  images,
  onDone,
}: {
  productId: string;
  images: Img[];
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inspection = images.filter((i) => i.kind === "INSPECTION");
  const storefront = images.filter((i) => !i.kind || i.kind === "STOREFRONT");

  const uploadStorefront = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (storefront.length >= 5) {
      onDone("Maximum 5 storefront images per product");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      Array.from(files)
        .slice(0, 5 - storefront.length)
        .forEach((f) => form.append("files", f));
      form.append("folder", "storefront");
      const up = await fetch("/api/uploads", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error || "Upload failed");

      const action = storefront.length === 0 ? "set_storefront_images" : "append_storefront_images";
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          action,
          imageUrls: upData.urls,
          coverIndex: 0,
        }),
      });
      const data = await res.json();
      onDone(res.ok ? "HUZA storefront images saved" : data.error || "Failed to save images");
    } catch (err) {
      onDone(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const promoteInspection = async () => {
    setBusy(true);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, action: "promote_inspection_images" }),
    });
    const data = await res.json();
    setBusy(false);
    onDone(
      res.ok
        ? "Copied farmer photos as temporary storefront images. Replace with HUZA photos when ready"
        : data.error || "Could not copy inspection photos"
    );
  };

  const setCover = async (imageId: string) => {
    setBusy(true);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, action: "set_cover", imageId }),
    });
    setBusy(false);
    onDone(res.ok ? "Cover image updated" : "Could not set cover");
  };

  return (
    <div className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-[#f8fbf9] p-3">
      {inspection.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
            Farmer inspection photos (not shown to customers)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {inspection.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id || img.url}
                src={img.url}
                alt=""
                className="h-14 w-14 rounded-lg object-cover border border-[var(--huza-line)]"
              />
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-2"
            disabled={busy}
            onClick={promoteInspection}
          >
            Use farmer photos temporarily
          </Button>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
          HUZA storefront images (home page &amp; shop)
        </p>
        <p className="mt-1 text-[11px] text-[var(--huza-muted)]">
          Cover image appears on home, category, and cart. Gallery shows on the product page.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {storefront.length === 0 ? (
            <p className="text-xs text-amber-800">No storefront images yet. Required before publishing.</p>
          ) : (
            storefront.map((img) => (
              <div key={img.id || img.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className={`h-16 w-16 rounded-lg object-cover border-2 ${
                    img.isCover ? "border-[var(--huza-green)]" : "border-[var(--huza-line)]"
                  }`}
                />
                {img.isCover && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-[var(--huza-green)] px-1 text-[9px] font-bold text-white">
                    Cover
                  </span>
                )}
                {img.id && !img.isCover && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setCover(img.id!)}
                    className="mt-1 block w-full text-[10px] font-semibold text-[var(--huza-green-dark)]"
                  >
                    Set cover
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <label className="mt-3 inline-block">
          <span className="sr-only">Upload HUZA photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            className="text-xs"
            onChange={(e) => {
              void uploadStorefront(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
