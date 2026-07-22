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

async function requireCmsAdmin() {
  return requireAdminSession({ modules: ["website_content", "categories", "promotions"] });
}

export async function GET() {
  const session = await requireCmsAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [raw, categories] = await Promise.all([
    getSetting(SHOP_HERO_SETTING_KEY, ""),
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

  const slides = parseShopHeroSlides(raw);
  return NextResponse.json({
    slides,
    defaults: DEFAULT_SHOP_HERO_SLIDES,
    categories,
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

  if (action === "save_category_names") {
    const rows = Array.isArray(body.categories) ? body.categories : null;
    if (!rows) {
      return NextResponse.json({ error: "categories array required" }, { status: 400 });
    }
    for (const row of rows) {
      const id = String(row.id || "");
      if (!id) continue;
      const nameEn = String(row.nameEn || "").trim();
      const nameRw = String(row.nameRw || "").trim();
      if (!nameEn) {
        return NextResponse.json({ error: "English name is required" }, { status: 400 });
      }
      await prisma.category.update({
        where: { id },
        data: {
          nameEn,
          nameRw: nameRw || nameEn,
          ...(row.nameFr !== undefined
            ? { nameFr: String(row.nameFr || "").trim() || nameEn }
            : {}),
        },
      });
    }
    await auditAdminAction(req, session, {
      action: "website.save_category_names",
      entity: "Category",
      details: `${rows.length} categories`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
