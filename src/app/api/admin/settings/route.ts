import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { setSetting } from "@/services/settings.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { canEditSystemSettings, isAdminPortalRole } from "@/lib/rbac";

async function requirePortalAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) return null;
  return session;
}

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canEditSystemSettings(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await requirePortalAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, zones, stockHistory, banners] = await Promise.all([
    prisma.websiteSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.deliveryZoneConfig.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.stockHistory.findMany({
      include: { product: { select: { nameEn: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.homepageBanner.findMany({ orderBy: { sortOrder: "asc" }, take: 10 }),
  ]);

  return NextResponse.json({ settings, zones, stockHistory, banners });
}

export async function PATCH(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const rl = await rateLimit({
    key: `admin-settings:${clientIp(req)}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const action = String(body.action || "");

  if (action === "setting") {
    const key = String(body.key || "");
    const value = String(body.value ?? "");
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
    await setSetting(key, value);
    await auditAdminAction(req, session, {
      action: "settings.update",
      entity: "WebsiteSetting",
      details: `${key}=${value}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "zone") {
    const { id, feeRwf, labelEn, isActive, etaMinutes } = body as {
      id?: string;
      feeRwf?: number;
      labelEn?: string;
      isActive?: boolean;
      etaMinutes?: number;
    };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updated = await prisma.deliveryZoneConfig.update({
      where: { id },
      data: {
        ...(feeRwf !== undefined ? { feeRwf: Number(feeRwf) } : {}),
        ...(labelEn !== undefined ? { labelEn: String(labelEn) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(etaMinutes !== undefined ? { etaMinutes: Number(etaMinutes) } : {}),
      },
    });
    await auditAdminAction(req, session, {
      action: "delivery_zone.update",
      entity: "DeliveryZoneConfig",
      entityId: id,
      details: JSON.stringify({ feeRwf, labelEn, isActive, etaMinutes }),
    });
    return NextResponse.json(updated);
  }

  if (action === "product_flags") {
    const { productId, isFeatured, isBestSeller, isNewArrival, isActive } = body as {
      productId: string;
      isFeatured?: boolean;
      isBestSeller?: boolean;
      isNewArrival?: boolean;
      isActive?: boolean;
    };
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (isFeatured !== undefined) data.isFeatured = isFeatured;
    if (isBestSeller !== undefined) data.isBestSeller = isBestSeller;
    if (isNewArrival !== undefined) data.isNewArrival = isNewArrival;
    if (isActive !== undefined) {
      data.isActive = isActive;
      data.deletedAt = isActive ? null : new Date();
    }
    const updated = await prisma.product.update({ where: { id: productId }, data });
    await auditAdminAction(req, session, {
      action: "product.flags",
      entity: "Product",
      entityId: productId,
      details: JSON.stringify(data),
    });
    return NextResponse.json(updated);
  }

  if (action === "soft_delete_product") {
    const productId = String(body.productId || "");
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false, deletedAt: new Date() },
    });
    await auditAdminAction(req, session, {
      action: "product.soft_delete",
      entity: "Product",
      entityId: productId,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
