import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { cacheDel, CacheKeys } from "@/lib/redis";

async function requireAdmin() {
  return requireAdminSession({ modules: ["promotions", "products"] });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(promotions);
}

/** Admin posts special offers shown on the homepage (not hardcoded). */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.titleEn || String(body.titleEn).trim().length < 2) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const promo = await prisma.promotion.create({
    data: {
      code: body.code ? String(body.code).trim().toUpperCase() : null,
      titleEn: String(body.titleEn).trim(),
      titleFr: String(body.titleFr || body.titleEn).trim(),
      titleRw: String(body.titleRw || body.titleEn).trim(),
      descriptionEn: body.descriptionEn ? String(body.descriptionEn).trim() : null,
      descriptionFr: body.descriptionFr
        ? String(body.descriptionFr).trim()
        : body.descriptionEn
          ? String(body.descriptionEn).trim()
          : null,
      descriptionRw: body.descriptionRw
        ? String(body.descriptionRw).trim()
        : body.descriptionEn
          ? String(body.descriptionEn).trim()
          : null,
      discountPct: body.discountPct != null && body.discountPct !== "" ? Number(body.discountPct) : null,
      discountAmt: body.discountAmt != null && body.discountAmt !== "" ? Number(body.discountAmt) : null,
      freeDelivery: Boolean(body.freeDelivery),
      isFlashSale: Boolean(body.isFlashSale),
      isActive: body.isActive !== false,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  await auditAdminAction(req, session, {
      action: "promotion.create",
    entity: "Promotion",
    entityId: promo.id,
    details: promo.titleEn,
  });
  await cacheDel(CacheKeys.homeCatalog);

  return NextResponse.json(promo);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action } = body as { id?: string; action?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "toggle") {
    const promo = await prisma.promotion.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    await auditAdminAction(req, session, {
      action: "promotion.toggle",
      entity: "Promotion",
      entityId: id,
      details: promo.isActive ? "activated" : "deactivated",
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(promo);
  }

  if (action === "update") {
    const promo = await prisma.promotion.update({
      where: { id },
      data: {
        ...(body.code !== undefined ? { code: body.code ? String(body.code).trim().toUpperCase() : null } : {}),
        ...(body.titleEn !== undefined ? { titleEn: String(body.titleEn).trim() } : {}),
        ...(body.titleFr !== undefined ? { titleFr: String(body.titleFr || body.titleEn).trim() } : {}),
        ...(body.titleRw !== undefined ? { titleRw: String(body.titleRw || body.titleEn).trim() } : {}),
        ...(body.descriptionEn !== undefined
          ? { descriptionEn: body.descriptionEn ? String(body.descriptionEn).trim() : null }
          : {}),
        ...(body.descriptionFr !== undefined
          ? { descriptionFr: body.descriptionFr ? String(body.descriptionFr).trim() : null }
          : {}),
        ...(body.descriptionRw !== undefined
          ? { descriptionRw: body.descriptionRw ? String(body.descriptionRw).trim() : null }
          : {}),
        ...(body.discountPct !== undefined
          ? { discountPct: body.discountPct === "" || body.discountPct == null ? null : Number(body.discountPct) }
          : {}),
        ...(body.discountAmt !== undefined
          ? { discountAmt: body.discountAmt === "" || body.discountAmt == null ? null : Number(body.discountAmt) }
          : {}),
        ...(body.freeDelivery !== undefined ? { freeDelivery: Boolean(body.freeDelivery) } : {}),
        ...(body.isFlashSale !== undefined ? { isFlashSale: Boolean(body.isFlashSale) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.startsAt !== undefined
          ? { startsAt: body.startsAt ? new Date(body.startsAt) : null }
          : {}),
        ...(body.endsAt !== undefined ? { endsAt: body.endsAt ? new Date(body.endsAt) : null } : {}),
      },
    });
    await auditAdminAction(req, session, {
      action: "promotion.update",
      entity: "Promotion",
      entityId: id,
      details: promo.titleEn,
    });
    await cacheDel(CacheKeys.homeCatalog);
    return NextResponse.json(promo);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.promotion.delete({ where: { id } });
  await auditAdminAction(req, session, {
      action: "promotion.delete",
    entity: "Promotion",
    entityId: id,
  });
  await cacheDel(CacheKeys.homeCatalog);
  return NextResponse.json({ ok: true });
}
