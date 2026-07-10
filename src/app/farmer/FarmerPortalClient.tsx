"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";

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
  category?: { nameEn: string } | null;
  images?: ProductImage[];
};

type Farmer = {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  sector: string | null;
  phone: string;
  email: string | null;
  nationalId: string | null;
  companyRegNo: string | null;
  tin: string | null;
  farmSize: string | null;
  productionCapacity: string | null;
  productCategories: string | null;
  paymentMomo: string | null;
  bankAccount: string | null;
  bankName: string | null;
  nationalIdUrl: string | null;
  businessCertUrl: string | null;
  foodSafetyUrl: string | null;
  organicCertUrl: string | null;
  availability: string;
  openHour: number;
  closeHour: number;
  status: string;
  products?: ProductRow[];
};

type Tab = "products" | "inventory" | "profile";

const TABS: { key: Tab; label: string }[] = [
  { key: "products", label: "Products & photos" },
  { key: "inventory", label: "Inventory" },
  { key: "profile", label: "Farm profile" },
];

async function uploadPhotos(files: FileList | File[]): Promise<string[]> {
  const list = Array.from(files);
  if (list.length === 0) return [];
  const form = new FormData();
  list.forEach((f) => form.append("files", f));
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Photo upload failed");
  return Array.isArray(data.urls) ? data.urls : [];
}

export function FarmerPortalClient({
  farmer,
  categories,
}: {
  farmer: Farmer;
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>(farmer.products || []);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const onPickPhotos = (files: FileList | null) => {
    if (!files?.length) {
      setPhotoPreviews([]);
      return;
    }
    setPhotoPreviews(Array.from(files).map((f) => URL.createObjectURL(f)));
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
      const res = await fetch("/api/supplier/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: form.get("nameEn"),
          descriptionEn: form.get("descriptionEn"),
          categoryId: form.get("categoryId"),
          price: Number(form.get("price")),
          unit: form.get("unit"),
          stockQty: Number(form.get("stockQty")),
          isOrganic: form.get("isOrganic") === "on",
          originDistrict: form.get("originDistrict") || farmer.district,
          imageUrls,
        }),
      });
      const data = await res.json();
      setMsg(res.ok ? "Product listed with photos for Huza review" : data.error || "Upload failed");
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

  const saveProduct = async (e: FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const form = new FormData(e.currentTarget);
      const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
      const payload: Record<string, unknown> = {
        nameEn: form.get("nameEn"),
        descriptionEn: form.get("descriptionEn"),
        price: Number(form.get("price")),
        stockQty: Number(form.get("stockQty")),
        isOrganic: form.get("isOrganic") === "on",
      };
      if (photos.length > 0) {
        payload.imageUrls = await uploadPhotos(photos);
      }
      const res = await fetch(`/api/supplier/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMsg(res.ok ? "Product updated" : data.error || "Update failed");
      if (res.ok) {
        setEditingId(null);
        await loadProducts();
        refresh();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
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

  const updateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: form.get("businessName"),
        description: form.get("description"),
        location: form.get("location"),
        district: form.get("district"),
        sector: form.get("sector"),
        phone: form.get("phone"),
        email: form.get("email"),
        nationalId: form.get("nationalId"),
        companyRegNo: form.get("companyRegNo"),
        tin: form.get("tin"),
        farmSize: form.get("farmSize"),
        productionCapacity: form.get("productionCapacity"),
        productCategories: form.get("productCategories"),
        paymentMomo: form.get("paymentMomo"),
        bankAccount: form.get("bankAccount"),
        bankName: form.get("bankName"),
        nationalIdUrl: form.get("nationalIdUrl"),
        businessCertUrl: form.get("businessCertUrl"),
        foodSafetyUrl: form.get("foodSafetyUrl"),
        organicCertUrl: form.get("organicCertUrl"),
        availability: form.get("availability"),
        openHour: Number(form.get("openHour")),
        closeHour: Number(form.get("closeHour")),
      }),
    });
    setMsg(res.ok ? "Profile updated" : "Update failed");
    refresh();
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

      {tab === "products" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={createProduct}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
          >
            <h2 className="font-semibold">List a product for Huza</h2>
            <p className="text-xs text-[var(--huza-muted)]">
              Upload clear photos of each product. Huza field agents visit farms, help with
              registration, and review what you list — Huza does not place online orders here.
            </p>
            <input name="nameEn" placeholder="Product name" className="input-field" required />
            <textarea
              name="descriptionEn"
              placeholder="Description, harvest notes, quality..."
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
            <div className="grid grid-cols-2 gap-2">
              <input
                name="price"
                type="number"
                placeholder="Ask price (RWF)"
                className="input-field"
                required
              />
              <select name="unit" className="input-field" defaultValue="KG">
                {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="stockQty"
                type="number"
                placeholder="Available quantity"
                className="input-field"
                required
              />
              <input
                name="originDistrict"
                placeholder="Origin district"
                defaultValue={farmer.district}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Product photos (required)</label>
              <input
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="input-field"
                required
                onChange={(e) => onPickPhotos(e.target.files)}
              />
              <p className="mt-1 text-[11px] text-[var(--huza-muted)]">
                Up to 8 photos · JPG/PNG/WebP · max 5MB each
              </p>
              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {photoPreviews.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt="Preview"
                      className="h-20 w-full rounded-lg object-cover border border-[var(--huza-line)]"
                    />
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input name="isOrganic" type="checkbox" /> Organic
            </label>
            <Button type="submit" className="w-full" disabled={busy || !approved}>
              {busy ? "Uploading…" : "Save product with photos"}
            </Button>
            {!approved && (
              <p className="text-xs text-[var(--huza-muted)]">
                Listing unlocks after admin approval (often with a Huza agent visit).
              </p>
            )}
          </form>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Your listed products</h2>
            <div className="space-y-4 max-h-[640px] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">No products listed yet.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                    {editingId === p.id ? (
                      <form onSubmit={(e) => saveProduct(e, p.id)} className="space-y-2">
                        <input
                          name="nameEn"
                          defaultValue={p.nameEn}
                          className="input-field"
                          required
                        />
                        <textarea
                          name="descriptionEn"
                          defaultValue={p.descriptionEn || ""}
                          className="input-field min-h-16"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            name="price"
                            type="number"
                            defaultValue={p.price}
                            className="input-field"
                            required
                          />
                          <input
                            name="stockQty"
                            type="number"
                            defaultValue={p.stockQty}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Replace photos (optional)</label>
                          <input
                            name="photos"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="input-field"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            name="isOrganic"
                            type="checkbox"
                            defaultChecked={p.isOrganic}
                          />{" "}
                          Organic
                        </label>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={busy}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex gap-3">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--huza-mint)]">
                            {p.images?.[0]?.url ? (
                              <Image
                                src={p.images[0].url}
                                alt={p.nameEn}
                                fill
                                className="object-cover"
                                unoptimized={p.images[0].url.startsWith("/uploads/")}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-[var(--huza-muted)]">
                                No photo
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{p.nameEn}</p>
                            <p className="text-xs text-[var(--huza-muted)] mt-1">
                              {formatRwf(p.price)}/{formatUnit(p.unit)} · Stock {p.stockQty}{" "}
                              {formatUnit(p.unit)}
                              {p.category ? ` · ${p.category.nameEn}` : ""}
                            </p>
                            <p className="text-[11px] text-[var(--huza-muted)] mt-1">
                              {(p.images?.length || 0)} photo{(p.images?.length || 0) === 1 ? "" : "s"}{" "}
                              · Listed for Huza agents
                            </p>
                          </div>
                        </div>
                        {(p.images?.length || 0) > 1 && (
                          <div className="mt-2 flex gap-1 overflow-x-auto">
                            {p.images!.slice(0, 6).map((img) => (
                              <div
                                key={img.url}
                                className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-[var(--huza-line)]"
                              >
                                <Image
                                  src={img.url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized={img.url.startsWith("/uploads/")}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                          onClick={() => setEditingId(p.id)}
                        >
                          Edit product / photos
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Inventory management</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">
            Keep available quantities up to date so Huza agents know what you can sell.
          </p>
          {products.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">List products with photos first.</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                const low = p.stockQty <= (p.lowStockAt || 5);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 flex flex-wrap items-end justify-between gap-3 ${
                      low ? "border-[var(--huza-gold)] bg-[#FFF8E6]" : "border-[var(--huza-line)]"
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--huza-mint)]">
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
                          Current: {p.stockQty} {formatUnit(p.unit)}
                          {low ? " · Low stock" : ""}
                        </p>
                      </div>
                    </div>
                    <form
                      className="flex items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        updateStock(p.id, Number(form.get("stockQty")));
                      }}
                    >
                      <div>
                        <label className="label">New stock</label>
                        <input
                          name="stockQty"
                          type="number"
                          min={0}
                          defaultValue={p.stockQty}
                          className="input-field w-28"
                          required
                        />
                      </div>
                      <Button type="submit" size="sm" disabled={busy}>
                        Update
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={updateProfile}
          className="max-w-3xl rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
        >
          <h2 className="font-semibold">Farm profile &amp; documents</h2>
          <p className="text-xs text-[var(--huza-muted)]">
            Keep this accurate for Huza agents who visit your farm to help you register and sell to
            HUZA FRESH.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="businessName"
              defaultValue={farmer.businessName}
              className="input-field"
              required
            />
            <input name="phone" defaultValue={farmer.phone} className="input-field" required />
            <input
              name="email"
              defaultValue={farmer.email ?? ""}
              className="input-field"
              placeholder="Email"
            />
            <input
              name="nationalId"
              defaultValue={farmer.nationalId ?? ""}
              className="input-field"
              placeholder="National ID"
            />
            <input name="location" defaultValue={farmer.location} className="input-field" required />
            <input name="district" defaultValue={farmer.district} className="input-field" required />
            <input
              name="sector"
              defaultValue={farmer.sector ?? ""}
              className="input-field"
              placeholder="Sector"
            />
            <input
              name="productCategories"
              defaultValue={farmer.productCategories ?? ""}
              className="input-field"
              placeholder="Product categories"
            />
            <input
              name="farmSize"
              defaultValue={farmer.farmSize ?? ""}
              className="input-field"
              placeholder="Farm size"
            />
            <input
              name="productionCapacity"
              defaultValue={farmer.productionCapacity ?? ""}
              className="input-field"
              placeholder="Production capacity"
            />
            <input
              name="paymentMomo"
              defaultValue={farmer.paymentMomo ?? ""}
              className="input-field"
              placeholder="MoMo number"
            />
            <input
              name="bankAccount"
              defaultValue={farmer.bankAccount ?? ""}
              className="input-field"
              placeholder="Bank account"
            />
            <input
              name="bankName"
              defaultValue={farmer.bankName ?? ""}
              className="input-field"
              placeholder="Bank name"
            />
            <input
              name="tin"
              defaultValue={farmer.tin ?? ""}
              className="input-field"
              placeholder="TIN"
            />
            <input
              name="companyRegNo"
              defaultValue={farmer.companyRegNo ?? ""}
              className="input-field"
              placeholder="Company reg. no."
            />
            <input
              name="nationalIdUrl"
              defaultValue={farmer.nationalIdUrl ?? ""}
              className="input-field"
              placeholder="National ID doc URL"
            />
            <input
              name="businessCertUrl"
              defaultValue={farmer.businessCertUrl ?? ""}
              className="input-field"
              placeholder="Business cert URL"
            />
            <input
              name="foodSafetyUrl"
              defaultValue={farmer.foodSafetyUrl ?? ""}
              className="input-field"
              placeholder="Food safety cert URL"
            />
            <input
              name="organicCertUrl"
              defaultValue={farmer.organicCertUrl ?? ""}
              className="input-field"
              placeholder="Organic cert URL"
            />
          </div>
          <textarea
            name="description"
            defaultValue={farmer.description ?? ""}
            className="input-field min-h-20"
          />
          <select name="availability" defaultValue={farmer.availability} className="input-field">
            <option value="OPEN">Open / available</option>
            <option value="BUSY">Busy</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Open hour</label>
              <input
                name="openHour"
                type="number"
                min={0}
                max={23}
                defaultValue={farmer.openHour}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Close hour</label>
              <input
                name="closeHour"
                type="number"
                min={0}
                max={23}
                defaultValue={farmer.closeHour}
                className="input-field"
              />
            </div>
          </div>
          <Button type="submit">Save farm profile</Button>
        </form>
      )}
    </div>
  );
}
