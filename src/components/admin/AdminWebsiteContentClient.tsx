"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  newShopHeroSlide,
  shopHeroCopy,
  type ShopHeroSlide,
} from "@/lib/shop-hero";
import {
  DEFAULT_SHOP_NAV_SHORTCUTS,
  type ShopNavShortcut,
} from "@/lib/shop-nav-shortcuts";

type CategoryRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  nameRw: string;
  isActive: boolean;
};

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  form.append("folder", "storefront");
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls[0] as string;
}

export function AdminWebsiteContentClient() {
  const [slides, setSlides] = useState<ShopHeroSlide[]>([]);
  const [navShortcuts, setNavShortcuts] = useState<ShopNavShortcut[]>(DEFAULT_SHOP_NAV_SHORTCUTS);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<"en" | "rw">("en");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/website-content");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const next = (data.slides || []) as ShopHeroSlide[];
      setSlides(next);
      setNavShortcuts(
        Array.isArray(data.navShortcuts) && data.navShortcuts.length
          ? (data.navShortcuts as ShopNavShortcut[])
          : DEFAULT_SHOP_NAV_SHORTCUTS
      );
      setCategories(data.categories || []);
      setSelectedId((prev) => prev || next[0]?.id || null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = slides.find((s) => s.id === selectedId) || slides[0];

  const updateSlide = (id: string, patch: Partial<ShopHeroSlide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const moveSlide = (id: string, dir: -1 | 1) => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy.map((s, i) => ({ ...s, sortOrder: i }));
    });
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => {
      const next = prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, sortOrder: i }));
      if (selectedId === id) setSelectedId(next[0]?.id || null);
      return next;
    });
  };

  const addSlide = () => {
    const slide = newShopHeroSlide();
    setSlides((prev) => [...prev, { ...slide, sortOrder: prev.length }]);
    setSelectedId(slide.id);
  };

  const onUpload = async (id: string, file: File | null) => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const url = await uploadImage(file);
      updateSlide(id, { imageUrl: url });
      setMsg("Image uploaded");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const saveHero = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/website-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_hero", slides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSlides(data.slides || slides);
      setMsg("Hero banner published");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveNavShortcuts = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/website-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_nav_shortcuts", navShortcuts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (Array.isArray(data.navShortcuts)) setNavShortcuts(data.navShortcuts);
      setMsg("Category shortcuts published");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const updateShortcut = (id: string, patch: Partial<ShopNavShortcut>) => {
    setNavShortcuts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const moveShortcut = (id: string, dir: -1 | 1) => {
    setNavShortcuts((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy.map((s, i) => ({ ...s, sortOrder: i }));
    });
  };

  const saveCategories = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/website-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_category_names", categories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Category names saved");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)]">Loading website content…</p>;
  }

  const preview = selected ? shopHeroCopy(selected, previewLocale) : null;

  return (
    <div className="space-y-8">
      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--admin-line)] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-ink)]">Hero Banner</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Upload slides, set English and Kinyarwanda copy, reorder, enable or disable, then
              publish.
            </p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={addSlide} disabled={busy}>
            <Plus className="mr-1 size-4" />
            Add slide
          </Button>
        </div>

        <form onSubmit={saveHero} className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`rounded-lg border px-2 py-2 ${
                  selected?.id === slide.id
                    ? "border-[var(--huza-green)] bg-[var(--huza-mint)]/30"
                    : "border-[var(--admin-line)]"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left text-sm font-medium"
                  onClick={() => setSelectedId(slide.id)}
                >
                  {index + 1}. {slide.badgeLabelEn || slide.headingEn || "Untitled"}{" "}
                  {!slide.enabled ? (
                    <span className="text-xs font-normal text-amber-700">(off)</span>
                  ) : null}
                </button>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    aria-label="Move up"
                    onClick={() => moveSlide(slide.id, -1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    aria-label="Move down"
                    onClick={() => moveSlide(slide.id, 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    aria-label="Remove slide"
                    onClick={() => removeSlide(slide.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {slides.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">No slides yet. Add one to start.</p>
            ) : null}
          </div>

          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.enabled}
                    onChange={(e) => updateSlide(selected.id, { enabled: e.target.checked })}
                  />
                  Enabled on Customer Website
                </label>
                <label className="text-sm">
                  Emoji{" "}
                  <input
                    className="admin-input ml-1 w-16"
                    value={selected.emoji}
                    onChange={(e) => updateSlide(selected.id, { emoji: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                    Hero image
                  </p>
                  <div className="relative mb-2 h-36 overflow-hidden rounded-lg bg-[var(--admin-soft)]">
                    {selected.imageUrl ? (
                      <Image
                        src={selected.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    ) : (
                      <p className="flex h-full items-center justify-center text-xs text-[var(--admin-muted)]">
                        No image
                      </p>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--huza-green-dark)]">
                    <Upload className="size-4" />
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void onUpload(selected.id, e.target.files?.[0] || null)}
                    />
                  </label>
                  {selected.imageUrl ? (
                    <button
                      type="button"
                      className="ml-3 text-sm text-rose-700 underline"
                      onClick={() => updateSlide(selected.id, { imageUrl: "" })}
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Image link (href)</span>
                    <input
                      className="admin-input"
                      value={selected.href}
                      onChange={(e) => updateSlide(selected.id, { href: e.target.value })}
                      placeholder="/products?category=…"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Primary button link</span>
                    <input
                      className="admin-input"
                      value={selected.primaryHref}
                      onChange={(e) => updateSlide(selected.id, { primaryHref: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Secondary button link</span>
                    <input
                      className="admin-input"
                      value={selected.secondaryHref}
                      onChange={(e) => updateSlide(selected.id, { secondaryHref: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)]/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                  Slide badge (on image)
                </p>
                <p className="mb-3 text-xs text-[var(--admin-muted)]">
                  Product or category name shown on the top-left of this slide image — not the main
                  CTA button.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Badge label (English)</span>
                    <input
                      className="admin-input"
                      value={selected.badgeLabelEn}
                      onChange={(e) =>
                        updateSlide(selected.id, { badgeLabelEn: e.target.value })
                      }
                      placeholder="e.g. Fresh Juices"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Badge label (Kinyarwanda)</span>
                    <input
                      className="admin-input"
                      value={selected.badgeLabelRw}
                      onChange={(e) =>
                        updateSlide(selected.id, { badgeLabelRw: e.target.value })
                      }
                      placeholder="e.g. Imvubo nshya"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2 rounded-lg border border-[var(--admin-line)] p-3">
                  <legend className="px-1 text-sm font-semibold">English</legend>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Main Heading</span>
                    <input
                      className="admin-input"
                      value={selected.headingEn}
                      onChange={(e) => updateSlide(selected.id, { headingEn: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Supporting Text</span>
                    <textarea
                      className="admin-input min-h-[72px]"
                      value={selected.supportEn}
                      onChange={(e) => updateSlide(selected.id, { supportEn: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Primary Button Text</span>
                    <input
                      className="admin-input"
                      value={selected.primaryCtaEn}
                      onChange={(e) => updateSlide(selected.id, { primaryCtaEn: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Secondary Button Text</span>
                    <input
                      className="admin-input"
                      value={selected.secondaryCtaEn}
                      onChange={(e) => updateSlide(selected.id, { secondaryCtaEn: e.target.value })}
                    />
                  </label>
                </fieldset>

                <fieldset className="space-y-2 rounded-lg border border-[var(--admin-line)] p-3">
                  <legend className="px-1 text-sm font-semibold">Kinyarwanda</legend>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Main Heading</span>
                    <input
                      className="admin-input"
                      value={selected.headingRw}
                      onChange={(e) => updateSlide(selected.id, { headingRw: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Supporting Text</span>
                    <textarea
                      className="admin-input min-h-[72px]"
                      value={selected.supportRw}
                      onChange={(e) => updateSlide(selected.id, { supportRw: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Primary Button Text</span>
                    <input
                      className="admin-input"
                      value={selected.primaryCtaRw}
                      onChange={(e) => updateSlide(selected.id, { primaryCtaRw: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Secondary Button Text</span>
                    <input
                      className="admin-input"
                      value={selected.secondaryCtaRw}
                      onChange={(e) => updateSlide(selected.id, { secondaryCtaRw: e.target.value })}
                    />
                  </label>
                </fieldset>
              </div>

              <div className="rounded-lg border border-dashed border-[var(--admin-line)] bg-[var(--admin-soft)] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <Eye className="size-4" />
                    Preview (before publish)
                  </p>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className={`rounded-md px-2 py-1 ${
                        previewLocale === "en"
                          ? "bg-[var(--huza-green)] text-white"
                          : "bg-white border"
                      }`}
                      onClick={() => setPreviewLocale("en")}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-2 py-1 ${
                        previewLocale === "rw"
                          ? "bg-[var(--huza-green)] text-white"
                          : "bg-white border"
                      }`}
                      onClick={() => setPreviewLocale("rw")}
                    >
                      Kinyarwanda
                    </button>
                  </div>
                </div>
                {preview ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--huza-green-dark)] shadow-sm">
                        <span aria-hidden>{selected.emoji}</span>
                        {preview.badgeLabel}
                      </p>
                      <p className="mt-2 text-lg font-bold text-[var(--huza-green-dark)]">
                        {preview.heading}
                      </p>
                      <p className="mt-1 text-sm text-[var(--admin-muted)]">{preview.support}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-[var(--huza-green)] px-3 py-1.5 text-xs font-semibold text-white">
                          {preview.primaryCta}
                        </span>
                        {preview.secondaryCta.trim() ? (
                          <span className="rounded-lg border border-[var(--huza-green)] bg-white px-3 py-1.5 text-xs font-semibold">
                            {preview.secondaryCta}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="relative h-28 overflow-hidden rounded-xl bg-white">
                      {selected.imageUrl ? (
                        <Image
                          src={selected.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="280px"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Publish hero banner"}
              </Button>
            </div>
          ) : null}
        </form>
      </section>

      <section className="rounded-xl border border-[var(--admin-line)] bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[var(--admin-ink)]">Category shortcuts</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Mobile rail (under search) and desktop Categories menu. Edit English and Kinyarwanda
          names, icon, order, and visibility. Saving also updates category names on the Customer
          Website.
        </p>
        <form onSubmit={saveNavShortcuts} className="mt-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-line)] text-xs uppercase text-[var(--admin-muted)]">
                  <th className="py-2 pr-2">Order</th>
                  <th className="py-2 pr-2">Icon</th>
                  <th className="py-2 pr-2">English name</th>
                  <th className="py-2 pr-2">Kinyarwanda name</th>
                  <th className="py-2 pr-2">Visible</th>
                  <th className="py-2">Slug</th>
                </tr>
              </thead>
              <tbody>
                {navShortcuts.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--admin-line)]/70">
                    <td className="py-2 pr-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded border border-[var(--admin-line)] p-1 hover:bg-[var(--admin-soft)]"
                          onClick={() => moveShortcut(s.id, -1)}
                          aria-label="Move up"
                          disabled={busy}
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded border border-[var(--admin-line)] p-1 hover:bg-[var(--admin-soft)]"
                          onClick={() => moveShortcut(s.id, 1)}
                          aria-label="Move down"
                          disabled={busy}
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="admin-input w-16 text-center text-lg"
                        value={s.emoji}
                        maxLength={8}
                        onChange={(e) => updateShortcut(s.id, { emoji: e.target.value })}
                        aria-label={`Icon for ${s.nameEn}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="admin-input"
                        value={s.nameEn}
                        onChange={(e) => updateShortcut(s.id, { nameEn: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="admin-input"
                        value={s.nameRw}
                        onChange={(e) => updateShortcut(s.id, { nameRw: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={s.visible}
                          onChange={(e) => updateShortcut(s.id, { visible: e.target.checked })}
                        />
                        <Eye className="size-3.5 text-[var(--admin-muted)]" />
                        Show
                      </label>
                    </td>
                    <td className="py-2 text-xs text-[var(--admin-muted)]">{s.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Publish category shortcuts"}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--admin-line)] bg-white p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[var(--admin-ink)]">All category names</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Full catalog category list (including any not shown as shortcuts). Prefer editing
          shortcuts above when possible.
        </p>
        <form onSubmit={saveCategories} className="mt-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-line)] text-xs uppercase text-[var(--admin-muted)]">
                  <th className="py-2 pr-2">English Name</th>
                  <th className="py-2 pr-2">Kinyarwanda Name</th>
                  <th className="py-2">Slug</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={c.id} className="border-b border-[var(--admin-line)]/70">
                    <td className="py-2 pr-2">
                      <input
                        className="admin-input"
                        value={c.nameEn}
                        onChange={(e) =>
                          setCategories((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, nameEn: e.target.value } : row
                            )
                          )
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="admin-input"
                        value={c.nameRw}
                        onChange={(e) =>
                          setCategories((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, nameRw: e.target.value } : row
                            )
                          )
                        }
                      />
                    </td>
                    <td className="py-2 text-xs text-[var(--admin-muted)]">{c.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save category names"}
          </Button>
        </form>
      </section>
    </div>
  );
}
