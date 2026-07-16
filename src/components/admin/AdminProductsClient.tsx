"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CATEGORY_EMOJI } from "@/lib/admin-nav";
import { formatRwf, formatUnit } from "@/lib/utils";
import type { CategoryRow } from "@/components/admin/AdminCategoriesClient";
import {
  ArrowLeft,
  ChevronDown,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  isCover?: boolean;
  sortOrder?: number;
};

type ProductRow = {
  id: string;
  nameEn: string;
  nameFr?: string;
  nameRw?: string;
  descriptionEn?: string;
  price: number;
  stockQty: number;
  reservedQty?: number;
  unit: string;
  isActive: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOrganic?: boolean;
  lowStockAt?: number;
  categoryId?: string;
  category?: { id: string; nameEn: string; slug: string } | null;
  images?: ProductImage[];
};

type FilterKey = "all" | "active" | "out" | "low" | "hidden" | "featured" | "bestseller";
type SortKey = "name" | "price" | "stock";

function emojiFor(slug: string) {
  return CATEGORY_EMOJI[slug] || "📦";
}

function availableQty(p: ProductRow) {
  return Math.max(0, p.stockQty - (p.reservedQty ?? 0));
}

function statusOf(p: ProductRow): { label: string; className: string } {
  if (!p.isActive) return { label: "Hidden", className: "admin-status admin-status-muted" };
  const avail = availableQty(p);
  if (avail <= 0) return { label: "Out of Stock", className: "admin-status admin-status-warn" };
  if (avail <= (p.lowStockAt ?? 5))
    return { label: "Low Stock", className: "admin-status admin-status-warn" };
  return { label: "Active", className: "admin-status admin-status-ok" };
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "featured", label: "Featured" },
  { key: "bestseller", label: "Best Seller" },
  { key: "out", label: "Out of Stock" },
  { key: "low", label: "Low Stock" },
  { key: "hidden", label: "Hidden" },
];

export function AdminProductsClient() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selected, setSelected] = useState<CategoryRow | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState<"create" | ProductRow | null>(null);
  const [bulkPrice, setBulkPrice] = useState("");
  const [form, setForm] = useState({
    nameEn: "",
    categoryId: "",
    price: "",
    stockQty: "",
    unit: "KG",
    description: "",
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isOrganic: false,
  });
  const [editImages, setEditImages] = useState<ProductImage[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
      else setMsg(data.error || "Failed to load categories");
    } catch {
      setMsg("Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const loadProducts = useCallback(async () => {
    if (!selected) return;
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        mode: "by_category",
        categoryId: selected.id,
        filter,
        sort,
      });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setSelectedIds(new Set());
      } else setMsg(data.error || "Failed to load products");
    } catch {
      setMsg("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  }, [selected, filter, sort, debouncedQ]);

  useEffect(() => {
    if (selected) void loadProducts();
  }, [selected, loadProducts]);

  const openCreate = () => {
    if (!selected) return;
    setForm({
      nameEn: "",
      categoryId: selected.id,
      price: "",
      stockQty: "0",
      unit: "KG",
      description: "",
      isActive: true,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      isOrganic: false,
    });
    setEditImages([]);
    setDrawer("create");
  };

  const openEdit = (p: ProductRow) => {
    setForm({
      nameEn: p.nameEn,
      categoryId: p.categoryId || p.category?.id || selected?.id || "",
      price: String(p.price),
      stockQty: String(p.stockQty),
      unit: p.unit || "KG",
      description: p.descriptionEn || "",
      isActive: p.isActive,
      isFeatured: Boolean(p.isFeatured),
      isBestSeller: Boolean(p.isBestSeller),
      isNewArrival: Boolean(p.isNewArrival),
      isOrganic: Boolean(p.isOrganic),
    });
    setEditImages([...(p.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    setDrawer(p);
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (drawer === "create") {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nameEn: form.nameEn.trim(),
            categoryId: form.categoryId,
            price: Number(form.price),
            stockQty: Number(form.stockQty),
            unit: form.unit,
            description: form.description,
            isActive: form.isActive,
            isFeatured: form.isFeatured,
            isBestSeller: form.isBestSeller,
            isNewArrival: form.isNewArrival,
            isOrganic: form.isOrganic,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        setMsg(`Added ${data.nameEn}`);
        setDrawer(null);
        await loadProducts();
        await loadCategories();
      } else if (drawer && typeof drawer === "object") {
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: drawer.id,
            action: "update_details",
            nameEn: form.nameEn.trim(),
            categoryId: form.categoryId,
            price: Number(form.price),
            stockQty: Number(form.stockQty),
            unit: form.unit,
            description: form.description,
            isActive: form.isActive,
            isFeatured: form.isFeatured,
            isBestSeller: form.isBestSeller,
            isNewArrival: form.isNewArrival,
            isOrganic: form.isOrganic,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        setMsg(`Saved ${data.nameEn}`);
        setDrawer(null);
        await loadProducts();
        await loadCategories();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length || !drawer || drawer === "create") return;
    if (editImages.length >= 5) {
      setMsg("Maximum 5 images per product");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      Array.from(files)
        .slice(0, 5 - editImages.length)
        .forEach((f) => formData.append("files", f));
      formData.append("folder", "storefront");
      const up = await fetch("/api/uploads", { method: "POST", body: formData });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error || "Upload failed");
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: drawer.id,
          action: "append_storefront_images",
          imageUrls: upData.urls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save images");
      setEditImages(data.images || []);
      setMsg("Images uploaded");
      await loadProducts();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const setCover = async (imageId: string) => {
    if (!drawer || drawer === "create") return;
    setBusy(true);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: drawer.id, action: "set_cover", imageId }),
    });
    setBusy(false);
    if (res.ok) {
      setEditImages((imgs) => imgs.map((i) => ({ ...i, isCover: i.id === imageId })));
      setMsg("Cover image updated");
      await loadProducts();
    } else setMsg("Could not set cover");
  };

  const deleteImage = async (imageId: string) => {
    if (!drawer || drawer === "create") return;
    setBusy(true);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: drawer.id, action: "delete_image", imageId }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setEditImages(data.images || []);
      setMsg("Image removed");
      await loadProducts();
    } else setMsg(data.error || "Could not delete image");
  };

  const onDropReorder = async (targetId: string) => {
    if (!dragId || dragId === targetId || !drawer || drawer === "create") return;
    const order = editImages.map((i) => i.id);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return;
    order.splice(from, 1);
    order.splice(to, 0, dragId);
    const next = order
      .map((id) => editImages.find((i) => i.id === id)!)
      .filter(Boolean)
      .map((img, i) => ({ ...img, sortOrder: i }));
    setEditImages(next);
    setDragId(null);
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: drawer.id,
        action: "reorder_images",
        imageIds: order,
      }),
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(products.map((p) => p.id)) : new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const runBulk = async (bulkAction: string, price?: number) => {
    if (!selectedIds.size) return;
    if (bulkAction === "delete" && !confirm(`Delete ${selectedIds.size} product(s)?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk",
          bulkAction,
          ids: [...selectedIds],
          ...(price !== undefined ? { price } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed");
      setMsg(`Updated ${data.count} product(s)`);
      setBulkPrice("");
      await loadProducts();
      await loadCategories();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setBusy(false);
    }
  };

  const exportSelected = () => {
    const rows = products.filter((p) => selectedIds.has(p.id));
    if (!rows.length) return;
    const header = ["Name", "Price", "Stock", "Unit", "Status"];
    const lines = [
      header.join(","),
      ...rows.map((p) =>
        [
          `"${p.nameEn.replace(/"/g, '""')}"`,
          p.price,
          availableQty(p),
          p.unit,
          statusOf(p).label,
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected?.slug || "products"}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noun = useMemo(() => {
    if (!selected) return "Product";
    const s = selected.slug;
    if (s.includes("fruit") && !s.includes("juice") && !s.includes("salad")) return "Fruit";
    if (s.includes("vegetable")) return "Vegetable";
    if (s.includes("juice")) return "Juice";
    if (s.includes("salad")) return "Salad";
    if (s.includes("seedling")) return "Seedling";
    if (s.includes("ornamental") || s.includes("plant")) return "Plant";
    return "Product";
  }, [selected]);

  /* ---------- Category picker ---------- */
  if (!selected) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="admin-panel-title">Products</h1>
          </div>
          <Button type="button" variant="ghost" disabled title="Pick a category first">
            <Plus className="size-4" />
            Add Product
          </Button>
        </div>

        {msg ? (
          <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
            {msg}
          </p>
        ) : null}

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
            Categories
          </h2>
          {loadingCats ? (
            <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
          ) : categories.length === 0 ? (
            <div className="admin-panel p-8 text-center text-sm text-[var(--admin-muted)]">
              No categories yet. Create one under Catalog → Categories first.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="admin-cat-card admin-cat-card--click text-left"
                  onClick={() => {
                    setSelected(c);
                    setQ("");
                    setFilter("all");
                    setMsg("");
                  }}
                >
                  <p className="text-2xl leading-none">{emojiFor(c.slug)}</p>
                  <h3 className="mt-2 text-base font-semibold">
                    {c.nameEn}{" "}
                    <span className="font-normal text-[var(--admin-muted)]">
                      ({c.stats.products})
                    </span>
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--admin-muted)]">
                    <span>Low {c.stats.lowStock}</span>
                    <span>Out {c.stats.outOfStock}</span>
                    <span>Hidden {c.stats.hidden}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- Inside a category ---------- */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--huza-green-dark)]"
            onClick={() => {
              setSelected(null);
              setProducts([]);
              setSelectedIds(new Set());
              void loadCategories();
            }}
          >
            <ArrowLeft className="size-3.5" />
            Products
          </button>
          <h1 className="admin-panel-title">
            {emojiFor(selected.slug)} {selected.nameEn}
          </h1>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Add {noun}
        </Button>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="admin-search-field relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="admin-input pl-9"
            placeholder={`Search in ${selected.nameEn}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="relative">
          <select
            className="admin-input appearance-none pr-8"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price</option>
            <option value="stock">Sort: Stock</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`admin-filter-chip ${filter === f.key ? "is-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {selectedIds.size > 0 ? (
        <div className="admin-bulk-bar">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="admin-input w-28"
              placeholder="New price"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy || !bulkPrice}
              onClick={() => void runBulk("price", Math.round(Number(bulkPrice)))}
            >
              Change Price
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => void runBulk("hide")}
            >
              Hide
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => void runBulk("show")}
            >
              Show
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={exportSelected}>
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => void runBulk("delete")}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      <div className="admin-panel overflow-hidden">
        {loadingProducts ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">
            No products in this category
            {debouncedQ || filter !== "all" ? " match your filters" : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === products.length && products.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Visibility</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const cover =
                    p.images?.find((i) => i.isCover)?.url || p.images?.[0]?.url || null;
                  const st = statusOf(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={(e) => toggleOne(p.id, e.target.checked)}
                          aria-label={`Select ${p.nameEn}`}
                        />
                      </td>
                      <td>
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" className="admin-thumb" />
                        ) : (
                          <span className="admin-thumb admin-thumb--empty">—</span>
                        )}
                      </td>
                      <td className="font-medium">
                        {p.nameEn}
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {p.isFeatured ? (
                            <span className="text-[10px] font-semibold text-[var(--huza-green-dark)]">
                              Featured
                            </span>
                          ) : null}
                          {p.isBestSeller ? (
                            <span className="text-[10px] font-semibold text-amber-700">
                              Best seller
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="tabular-nums">{formatRwf(p.price)}</td>
                      <td className="tabular-nums">
                        {availableQty(p)} {formatUnit(p.unit)}
                      </td>
                      <td className="text-xs text-[var(--admin-muted)]">
                        {p.isActive ? "Shop visible" : "Hidden"}
                      </td>
                      <td>
                        <span className={st.className}>{st.label}</span>
                      </td>
                      <td className="text-right">
                        <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer ? (
        <div className="admin-drawer-backdrop" onClick={() => setDrawer(null)}>
          <aside
            className="admin-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={drawer === "create" ? `Add ${noun}` : "Edit Product"}
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">
                {drawer === "create" ? `Add ${noun}` : "Edit Product"}
              </h2>
              <button type="button" className="admin-icon-btn" onClick={() => setDrawer(null)}>
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={saveProduct} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              {drawer !== "create" ? (
                <div>
                  <p className="mb-2 text-sm font-medium">Images</p>
                  <p className="mb-2 text-xs text-[var(--admin-muted)]">
                    Up to 5 images. Drag to reorder. Cover shows on product cards.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {editImages.map((img) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={() => setDragId(img.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => void onDropReorder(img.id)}
                        className={`relative rounded-lg border-2 ${
                          img.isCover
                            ? "border-[var(--huza-green)]"
                            : "border-[var(--admin-line)]"
                        } bg-[var(--admin-soft)] p-1`}
                      >
                        <div className="absolute left-0.5 top-0.5 rounded bg-black/40 p-0.5 text-white">
                          <GripVertical className="size-3" />
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="h-16 w-16 rounded object-cover" />
                        {img.isCover ? (
                          <span className="mt-1 block text-center text-[9px] font-bold text-[var(--huza-green-dark)]">
                            Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="mt-1 block w-full text-[10px] font-semibold text-[var(--huza-green-dark)]"
                            disabled={busy}
                            onClick={() => void setCover(img.id)}
                          >
                            Set cover
                          </button>
                        )}
                        <button
                          type="button"
                          className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow"
                          title="Delete"
                          disabled={busy}
                          onClick={() => void deleteImage(img.id)}
                        >
                          <Trash2 className="size-3 text-rose-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {editImages.length < 5 ? (
                    <label className="mt-3 inline-block text-xs font-semibold text-[var(--huza-green-dark)]">
                      + Upload images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={busy}
                        onChange={(e) => {
                          void uploadImages(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-[var(--admin-muted)]">
                  Save the product first, then reopen Edit to upload images.
                </p>
              )}

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Name</span>
                <input
                  className="admin-input"
                  required
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Category</span>
                <select
                  className="admin-input"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Price (RWF)</span>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Stock</span>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    required
                    value={form.stockQty}
                    onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Unit</span>
                <select
                  className="admin-input"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                >
                  <option value="KG">kg</option>
                  <option value="PIECE">piece</option>
                  <option value="BUNCH">bunch</option>
                  <option value="LITRE">litre</option>
                  <option value="PACK">pack</option>
                  <option value="DOZEN">dozen</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Description</span>
                <textarea
                  className="admin-input min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <fieldset className="space-y-2 rounded-lg border border-[var(--admin-line)] p-3">
                <legend className="px-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                  Visibility &amp; merchandising
                </legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Active (visible in shop)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  />
                  Featured on homepage
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={(e) => setForm((f) => ({ ...f, isBestSeller: e.target.checked }))}
                  />
                  Best seller
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm((f) => ({ ...f, isNewArrival: e.target.checked }))}
                  />
                  New arrival
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isOrganic}
                    onChange={(e) => setForm((f) => ({ ...f, isOrganic: e.target.checked }))}
                  />
                  Organic
                </label>
              </fieldset>

              <div className="mt-auto flex gap-2 border-t border-[var(--admin-line)] pt-4">
                <Button type="submit" disabled={busy} className="flex-1">
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setDrawer(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
