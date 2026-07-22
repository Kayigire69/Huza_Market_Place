import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { getSetting, setSetting } from "@/services/settings.service";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import {
  DEFAULT_SHOP_HERO_SLIDES,
  SHOP_HERO_SETTING_KEY,
  parseShopHeroSlides,
  serializeShopHeroSlides,
  type ShopHeroSlide,
} from "@/lib/shop-hero";
import {
  DEFAULT_SHOP_NAV_SHORTCUTS,
  SHOP_NAV_SHORTCUTS_SETTING_KEY,
  parseShopNavShortcuts,
  remapCategoryNameRw,
  serializeShopNavShortcuts,
  type ShopNavShortcut,
} from "@/lib/shop-nav-shortcuts";

async function requireCmsAdmin() {
  return requireAdminSession({ modules: ["website_content", "categories", "promotions"] });
}

export async function GET() {
  const session = await requireCmsAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [heroRaw, navRaw, categories] = await Promise.all([
    getSetting(SHOP_HERO_SETTING_KEY, ""),
    getSetting(SHOP_NAV_SHORTCUTS_SETTING_KEY, ""),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameFr: true,
        nameRw: true,
        isActive: true,
        sortOrder: true,
      },
    }),
  ]);

  const slides = parseShopHeroSlides(heroRaw);
  const navShortcuts = parseShopNavShortcuts(navRaw);

  return NextResponse.json({
    slides,
    defaults: DEFAULT_SHOP_HERO_SLIDES,
    navShortcuts,
    navDefaults: DEFAULT_SHOP_NAV_SHORTCUTS,
    categories: categories.map((c) => ({
      ...c,
      nameRw: remapCategoryNameRw(c.slug, c.nameRw),
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await requireCmsAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const action = String(body.action || "save_hero");

  if (action === "save_hero") {
    const slides = Array.isArray(body.slides) ? (body.slides as ShopHeroSlide[]) : null;
    if (!slides) {
      return NextResponse.json({ error: "slides array required" }, { status: 400 });
    }
    for (const slide of slides) {
      if (!String(slide.imageUrl || "").trim()) {
        return NextResponse.json(
          { error: "Each slide needs an image. Upload or remove empty slides." },
          { status: 400 }
        );
      }
    }
    const json = serializeShopHeroSlides(slides);
    await setSetting(SHOP_HERO_SETTING_KEY, json);
    await auditAdminAction(req, session, {
      action: "website.save_hero",
      entity: "WebsiteSetting",
      entityId: SHOP_HERO_SETTING_KEY,
      details: `${slides.length} slides`,
    });
    return NextResponse.json({ ok: true, slides: parseShopHeroSlides(json) });
  }

  if (action === "save_nav_shortcuts") {
    const rows = Array.isArray(body.navShortcuts)
      ? (body.navShortcuts as ShopNavShortcut[])
      : null;
    if (!rows) {
      return NextResponse.json({ error: "navShortcuts array required" }, { status: 400 });
    }
    for (const row of rows) {
      if (!String(row.slug || "").trim()) {
        return NextResponse.json({ error: "Each shortcut needs a category slug" }, { status: 400 });
      }
      if (!String(row.nameEn || "").trim()) {
        return NextResponse.json({ error: "English name is required" }, { status: 400 });
      }
    }
    const json = serializeShopNavShortcuts(rows);
    const saved = parseShopNavShortcuts(json);
    await setSetting(SHOP_NAV_SHORTCUTS_SETTING_KEY, json);

    // Keep Category names / order in sync so the rest of the shop matches the rail.
    for (const [index, row] of saved.entries()) {
      const nameEn = row.nameEn.trim();
      const nameRw = remapCategoryNameRw(row.slug, row.nameRw.trim() || nameEn);
      await prisma.category.updateMany({
        where: { slug: row.slug, deletedAt: null },
        data: {
          nameEn,
          nameRw,
          nameFr: nameEn,
          sortOrder: index,
        },
      });
    }

    await auditAdminAction(req, session, {
      action: "website.save_nav_shortcuts",
      entity: "WebsiteSetting",
      entityId: SHOP_NAV_SHORTCUTS_SETTING_KEY,
      details: `${saved.length} shortcuts`,
    });
    return NextResponse.json({ ok: true, navShortcuts: saved });
  }

  if (action === "save_category_names") {
    const rows = Array.isArray(body.categories) ? body.categories : null;
    if (!rows) {
      return NextResponse.json({ error: "categories array required" }, { status: 400 });
    }
    const slugById = new Map<string, string>();
    for (const row of rows) {
      const id = String(row.id || "");
      if (!id) continue;
      const nameEn = String(row.nameEn || "").trim();
      const nameRwRaw = String(row.nameRw || "").trim();
      if (!nameEn) {
        return NextResponse.json({ error: "English name is required" }, { status: 400 });
      }
      const existing = await prisma.category.findUnique({
        where: { id },
        select: { slug: true },
      });
      if (!existing) continue;
      slugById.set(id, existing.slug);
      const nameRw = remapCategoryNameRw(existing.slug, nameRwRaw || nameEn);
      await prisma.category.update({
        where: { id },
        data: {
          nameEn,
          nameRw,
          ...(row.nameFr !== undefined
            ? { nameFr: String(row.nameFr || "").trim() || nameEn }
            : {}),
        },
      });
    }

    const navRaw = await getSetting(SHOP_NAV_SHORTCUTS_SETTING_KEY, "");
    const nav = parseShopNavShortcuts(navRaw).map((s) => {
      const match = rows.find((r: { id?: string }) => slugById.get(String(r.id || "")) === s.slug);
      if (!match) return s;
      const nameEn = String(match.nameEn || "").trim() || s.nameEn;
      const nameRw = remapCategoryNameRw(
        s.slug,
        String(match.nameRw || "").trim() || nameEn
      );
      return { ...s, nameEn, nameRw };
    });
    await setSetting(SHOP_NAV_SHORTCUTS_SETTING_KEY, serializeShopNavShortcuts(nav));

    await auditAdminAction(req, session, {
      action: "website.save_category_names",
      entity: "Category",
      details: `${rows.length} categories`,
    });
    return NextResponse.json({ ok: true, navShortcuts: nav });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
