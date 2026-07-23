"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CATEGORY_EMOJI } from "@/lib/admin-nav";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export type CategoryRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  stats: {
    products: number;
    lowStock: number;
    outOfStock: number;
    hidden: number;
  };
};

const emptyForm = {
  nameEn: "",
  nameFr: "",
  nameRw: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

function emojiFor(slug: string) {
  return CATEGORY_EMOJI[slug] || CATEGORY_EMOJI[slug.replace(/-/g, "")] || "📦";
}

export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [drawer, setDrawer] = useState<"create" | CategoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
      else setMsg(data.error || "Failed to load categories");
    } catch {
      setMsg("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setDrawer("create");
  };

  const openEdit = (c: CategoryRow) => {
    setForm({
      nameEn: c.nameEn,
      nameFr: c.nameFr,
      nameRw: c.nameRw,
      description: c.description || "",
      imageUrl: c.imageUrl || "",
      isActive: c.isActive,
    });
    setDrawer(c);
  };

  const uploadImage = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", files[0]);
      fd.append("folder", "storefront");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = Array.isArray(data.urls) ? data.urls[0] : null;
      if (!url) throw new Error("No image URL returned");
      setForm((f) => ({ ...f, imageUrl: url }));
      setMsg("Category image uploaded — save to apply");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nameEn.trim()) {
      setMsg("Name is required");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        nameEn: form.nameEn.trim(),
        nameFr: form.nameFr.trim() || form.nameEn.trim(),
        nameRw: form.nameRw.trim() || form.nameEn.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
      };
      if (drawer === "create") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        setMsg(`Created ${data.nameEn}`);
      } else if (drawer && typeof drawer === "object") {
        const res = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: drawer.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        setMsg(`Updated ${data.nameEn}`);
      }
      setDrawer(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: CategoryRow) => {
    if (!confirm(`Hide / remove category “${c.nameEn}”? Products stay in the DB.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg(`Removed ${c.nameEn}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">Categories</h1>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading categories…</p>
      ) : categories.length === 0 ? (
        <div className="admin-panel p-8 text-center">
          <p className="text-sm text-[var(--admin-muted)]">No categories yet.</p>
          <Button type="button" className="mt-3" onClick={openCreate}>
            Add your first category
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <article key={c.id} className="admin-cat-card">
              <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-[var(--admin-soft)]">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.nameEn} fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">
                    {emojiFor(c.slug)}
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-[var(--admin-ink)]">
                    {c.nameEn}
                  </h2>
                  {c.nameRw && c.nameRw !== c.nameEn ? (
                    <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">{c.nameRw}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                    {c.stats.products} Products
                    {!c.isActive ? " · Hidden" : ""}
                    {!c.imageUrl ? " · No category photo" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    title="Edit"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    title="Remove"
                    disabled={busy}
                    onClick={() => void remove(c)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--admin-line)] pt-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                    Low Stock
                  </p>
                  <p className="text-lg font-bold tabular-nums text-amber-700">{c.stats.lowStock}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                    Out of Stock
                  </p>
                  <p className="text-lg font-bold tabular-nums text-rose-700">
                    {c.stats.outOfStock}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                    Hidden
                  </p>
                  <p className="text-lg font-bold tabular-nums text-[var(--admin-muted)]">
                    {c.stats.hidden}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {drawer ? (
        <div className="admin-drawer-backdrop" onClick={() => setDrawer(null)}>
          <aside
            className="admin-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={drawer === "create" ? "Add Category" : "Edit Category"}
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <h2 className="text-lg font-semibold">
                {drawer === "create" ? "Add Category" : "Edit Category"}
              </h2>
              <button type="button" className="admin-icon-btn" onClick={() => setDrawer(null)}>
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={save} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div className="block text-sm">
                <span className="mb-1 block font-medium">Category photo (shop card)</span>
                <div className="relative mb-2 aspect-[16/10] overflow-hidden rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)]">
                  {form.imageUrl ? (
                    <Image
                      src={form.imageUrl}
                      alt="Category"
                      fill
                      className="object-cover"
                      sizes="360px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--admin-muted)]">
                      No photo yet
                    </div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--admin-ink)]">
                  <span className="rounded-md border border-[var(--admin-line)] bg-white px-3 py-1.5">
                    {uploading ? "Uploading…" : form.imageUrl ? "Replace photo" : "Upload photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy || uploading}
                    onChange={(e) => {
                      void uploadImage(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                {form.imageUrl ? (
                  <button
                    type="button"
                    className="ml-3 text-xs text-[var(--admin-muted)] underline"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">English Name</span>
                <input
                  className="admin-input"
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  required
                  placeholder="e.g. Fresh Fruits"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Name (French)</span>
                <input
                  className="admin-input"
                  value={form.nameFr}
                  onChange={(e) => setForm((f) => ({ ...f, nameFr: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Kinyarwanda Name</span>
                <input
                  className="admin-input"
                  value={form.nameRw}
                  onChange={(e) => setForm((f) => ({ ...f, nameRw: e.target.value }))}
                  placeholder="e.g. Imbuto"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Description</span>
                <textarea
                  className="admin-input min-h-[88px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible in shop)
              </label>
              <div className="mt-auto flex gap-2 border-t border-[var(--admin-line)] pt-4">
                <Button type="submit" disabled={busy || uploading} className="flex-1">
                  {busy ? "Saving…" : uploading ? "Uploading…" : "Save"}
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
