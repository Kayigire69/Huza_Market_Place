"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import {
  FIELD_TYPES,
  PAYMENT_OPTIONS,
  PRICE_UNITS,
  QUALITY_LEVELS,
} from "@/lib/farmer-dossier";
import { FarmerDossierForm, type FarmerDossierValues } from "./FarmerDossierForm";

type Category = { id: string; nameEn: string; slug: string };
type ProductImage = { id?: string; url: string; alt?: string | null };

type ProductRow = {
  id: string;
  nameEn: string;
  descriptionEn?: string;
  price: number;
  unit: string;
  stockQty: number;
  lowStockAt: number;
  isActive: boolean;
  isOrganic: boolean;
  reviewStatus?: string;
  reviewNote?: string | null;
  qualityGeneral?: string | null;
  fieldType?: string | null;
  currentCrop?: string | null;
  category?: { nameEn: string } | null;
  images?: ProductImage[];
};

type Farmer = FarmerDossierValues & {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  sector: string | null;
  phone: string;
  email: string | null;
  nationalId: string | null;
  farmSize: string | null;
  status: string;
  products?: ProductRow[];
  user?: { fullName?: string } | null;
};

type Tab = "dossier" | "products" | "inventory";

const TABS: { key: Tab; label: string }[] = [
  { key: "dossier", label: "Farmer information" },
  { key: "products", label: "Products & photos" },
  { key: "inventory", label: "Inventory" },
];

async function uploadPhotos(files: FileList | File[]): Promise<string[]> {
  const list = Array.from(files);
  if (list.length === 0) return [];
  const form = new FormData();
  list.forEach((f) => form.append("files", f));
  form.append("folder", "products");
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Photo upload failed");
  return Array.isArray(data.urls) ? data.urls : [];
}

async function uploadOne(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  form.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls[0] as string;
}

export function FarmerPortalClient({
  farmer,
  categories,
}: {
  farmer: Farmer;
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dossier");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>(farmer.products || []);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const refresh = () => router.refresh();
  const approved = farmer.status === "APPROVED";

  useEffect(() => {
    setProducts(farmer.products || []);
  }, [farmer.products]);

  const loadProducts = async () => {
    const res = await fetch("/api/supplier/products");
    const data = await res.json();
    if (Array.isArray(data)) setProducts(data);
  };

  const createProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!approved) {
      setMsg("Wait for admin approval before listing products.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const form = new FormData(e.currentTarget);
      const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
      if (photos.length === 0) {
        setMsg("Add at least one product photo.");
        setBusy(false);
        return;
      }
      const imageUrls = await uploadPhotos(photos);
      let proofOfPaymentUrl = String(form.get("proofOfPaymentUrl") || "");
      const proof = form.get("proofOfPayment");
      if (proof instanceof File && proof.size > 0) {
        proofOfPaymentUrl = await uploadOne(proof, "documents");
      }

      const payload = Object.fromEntries(form.entries());
      delete payload.photos;
      delete payload.proofOfPayment;

      const res = await fetch("/api/supplier/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          price: Number(payload.pricePerUnit || payload.price || 0),
          stockQty: Number(payload.stockQty || payload.totalQuantityHarvested || 0),
          isOrganic: form.get("isOrganic") === "on",
          originDistrict: payload.originDistrict || farmer.district,
          imageUrls,
          proofOfPaymentUrl,
          pricePerUnit: Number(payload.pricePerUnit || 0),
          farmGatePrice: payload.farmGatePrice ? Number(payload.farmGatePrice) : null,
          priceUponDelivery: payload.priceUponDelivery
            ? Number(payload.priceUponDelivery)
            : null,
          priceAfterSale: payload.priceAfterSale ? Number(payload.priceAfterSale) : null,
          totalKgsBoughtByHuza: payload.totalKgsBoughtByHuza
            ? Number(payload.totalKgsBoughtByHuza)
            : 0,
        }),
      });
      const data = await res.json();
      setMsg(
        res.ok
          ? "Product submitted for Huza review (photos + field dossier)."
          : data.error || "Upload failed"
      );
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        setPhotoPreviews([]);
        await loadProducts();
        refresh();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const updateStock = async (id: string, stockQty: number) => {
    setBusy(true);
    const res = await fetch(`/api/supplier/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Inventory updated" : data.error || "Update failed");
    if (res.ok) {
      await loadProducts();
      refresh();
    }
  };

  const dossierInitial: FarmerDossierValues = {
    ...farmer,
    fullName: farmer.user?.fullName || farmer.businessName,
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === key
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "dossier" && (
        <div>
          <p className="mb-4 text-sm text-[var(--huza-muted)]">
            Complete all sections below. Huza uses this information when accepting or rejecting your
            products.
          </p>
          <FarmerDossierForm initial={dossierInitial} onSaved={refresh} />
        </div>
      )}

      {tab === "products" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={createProduct}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4"
          >
            <h2 className="font-semibold">Submit product for Huza review</h2>
            <p className="text-xs text-[var(--huza-muted)]">
              Include photos plus field, production, sales, and payment details. Huza agents review
              this before accepting the product.
            </p>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Product &amp; photos</h3>
              <input name="nameEn" placeholder="Product / current crop name" className="input-field" required />
              <textarea
                name="descriptionEn"
                placeholder="Short description"
                className="input-field min-h-16"
              />
              <select name="categoryId" className="input-field" required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
              <input
                name="photos"
                type="file"
                accept="image/*"
                multiple
                className="input-field"
                required
                onChange={(e) =>
                  setPhotoPreviews(
                    e.target.files ? Array.from(e.target.files).map((f) => URL.createObjectURL(f)) : []
                  )
                }
              />
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photoPreviews.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="h-16 w-full rounded object-cover" />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
              <h3 className="text-sm font-semibold">Field information</h3>
              <select name="fieldType" className="input-field" defaultValue={farmer.fieldType || ""} required>
                <option value="">Greenhouse or open field</option>
                {FIELD_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <input
                name="fieldSize"
                className="input-field"
                placeholder="Size"
                defaultValue={farmer.farmSize || ""}
                required
              />
              <input
                name="pastCropsSeason1"
                className="input-field"
                placeholder="Past crops — season 1"
                defaultValue={farmer.pastCropsSeason1 || ""}
              />
              <input
                name="pastCropsSeason2"
                className="input-field"
                placeholder="Past crops — season 2"
                defaultValue={farmer.pastCropsSeason2 || ""}
              />
              <input
                name="pastCropsSeason3"
                className="input-field"
                placeholder="Past crops — season 3"
                defaultValue={farmer.pastCropsSeason3 || ""}
              />
              <input
                name="currentCrop"
                className="input-field"
                placeholder="Current crop"
                defaultValue={farmer.currentCrop || ""}
                required
              />
              <input name="chemicalsPerWeek" className="input-field" placeholder="Chemicals sprayed per week" />
              <input name="chemicalsWhy" className="input-field" placeholder="Why chemicals are used" />
              <input name="chemicalsDosage" className="input-field" placeholder="Dosage" />
              <input name="fertilizerPerWeek" className="input-field" placeholder="Fertilizer applied per week" />
              <input name="irrigationMethod" className="input-field" placeholder="Irrigation method" />
              <input name="diseasesIdentified" className="input-field" placeholder="Diseases identified" />
              <input name="pestsIdentified" className="input-field" placeholder="Pests identified" />
            </div>

            <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
              <h3 className="text-sm font-semibold">Production information</h3>
              <input
                name="totalQuantityHarvested"
                className="input-field"
                placeholder="Total quantity harvested"
                required
              />
              <select name="qualityGeneral" className="input-field" required>
                <option value="">Quality in general</option>
                {QUALITY_LEVELS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <input name="stockQty" type="number" className="input-field" placeholder="Available stock qty" />
            </div>

            <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
              <h3 className="text-sm font-semibold">Sales</h3>
              <select name="priceUnit" className="input-field" defaultValue="kg">
                {PRICE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    Price per {u}
                  </option>
                ))}
              </select>
              <input
                name="pricePerUnit"
                type="number"
                className="input-field"
                placeholder="Price (RWF)"
                required
              />
              <input
                name="totalKgsBoughtByHuza"
                type="number"
                step="0.1"
                className="input-field"
                placeholder="Total kgs bought by Huza"
                defaultValue={0}
              />
            </div>

            <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
              <h3 className="text-sm font-semibold">Payment options</h3>
              <select name="paymentOption" className="input-field" required>
                <option value="">Select payment option</option>
                {PAYMENT_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input name="farmGatePrice" type="number" className="input-field" placeholder="Farm gate price (RWF)" />
              <input
                name="priceUponDelivery"
                type="number"
                className="input-field"
                placeholder="Price upon delivery (RWF)"
              />
              <input
                name="priceAfterSale"
                type="number"
                className="input-field"
                placeholder="Price after sale (RWF)"
              />
              <div>
                <label className="label">Proof of payment (attach document)</label>
                <input name="proofOfPayment" type="file" accept="image/*,application/pdf" className="input-field" />
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--huza-line)] pt-3">
              <h3 className="text-sm font-semibold">Comments</h3>
              <textarea
                name="farmerComments"
                className="input-field min-h-20"
                placeholder="Comments for Huza review"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input name="isOrganic" type="checkbox" /> Organic
            </label>
            <Button type="submit" className="w-full" disabled={busy || !approved}>
              {busy ? "Submitting…" : "Submit product for Huza review"}
            </Button>
            {!approved && (
              <p className="text-xs text-[var(--huza-muted)]">
                Complete Farmer information and wait for approval before submitting products.
              </p>
            )}
          </form>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Submitted products</h2>
            <div className="space-y-3 max-h-[720px] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">No products yet.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--huza-mint)]">
                        {p.images?.[0]?.url ? (
                          <Image
                            src={p.images[0].url}
                            alt={p.nameEn}
                            fill
                            className="object-cover"
                            unoptimized={p.images[0].url.startsWith("/uploads/")}
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium">{p.nameEn}</p>
                        <p className="text-xs text-[var(--huza-muted)]">
                          {formatRwf(p.price)}/{formatUnit(p.unit)} · Stock {p.stockQty}
                          {p.qualityGeneral ? ` · Quality ${p.qualityGeneral}` : ""}
                        </p>
                        <p className="text-[11px] mt-1 font-semibold text-[var(--huza-green-dark)]">
                          Review: {p.reviewStatus || "PENDING"}
                        </p>
                        {p.reviewNote && (
                          <p className="text-[11px] text-[var(--huza-muted)]">Note: {p.reviewNote}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Inventory</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">Update available stock for listed products.</p>
          {products.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">Submit products first.</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[var(--huza-line)] p-3 flex flex-wrap items-end justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{p.nameEn}</p>
                    <p className="text-xs text-[var(--huza-muted)]">
                      Current: {p.stockQty} {formatUnit(p.unit)}
                    </p>
                  </div>
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      updateStock(p.id, Number(form.get("stockQty")));
                    }}
                  >
                    <input
                      name="stockQty"
                      type="number"
                      min={0}
                      defaultValue={p.stockQty}
                      className="input-field w-28"
                      required
                    />
                    <Button type="submit" size="sm" disabled={busy}>
                      Update
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
