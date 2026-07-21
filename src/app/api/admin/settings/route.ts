import { NextResponse } from "next/server";
import { requireAdminSession, requirePortalSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import {
  getAdminSettingsBundle,
  setSetting,
  setSettingsBulk,
  syncAllZoneFees,
  SETTING_DEFAULTS,
} from "@/services/settings.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { canEditSystemSettings } from "@/lib/rbac";
import { ADMIN_ROLE_MODULES } from "@/lib/admin-nav";

async function requirePortalAdmin() {
  return requirePortalSession();
}

async function requireSuperAdmin() {
  const session = await requireAdminSession({ modules: ["settings"] });
  if (!session?.user || !canEditSystemSettings(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await requirePortalAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, zones, hours, emergency, staffCount] = await Promise.all([
    getAdminSettingsBundle(),
    prisma.deliveryZoneConfig.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.emergencyClosure.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.user.count({
      where: {
        role: { notIn: ["CUSTOMER", "SUPPLIER", "DELIVERY"] },
        deletedAt: null,
      },
    }),
  ]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return NextResponse.json({
    settings,
    defaults: SETTING_DEFAULTS,
    zones,
    canEdit: canEditSystemSettings(session.user.role),
    hours: hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      day: dayNames[h.dayOfWeek] || String(h.dayOfWeek),
      openHour: h.openHour,
      closeHour: h.closeHour,
      isClosed: h.isClosed,
    })),
    emergency: emergency
      ? { reason: emergency.reason, startsAt: emergency.startsAt, endsAt: emergency.endsAt }
      : null,
    roles: Object.entries(ADMIN_ROLE_MODULES).map(([role, modules]) => ({
      role,
      modules,
    })),
    system: {
      staffCount,
      nodeEnv: process.env.NODE_ENV || "development",
      mtnConfigured: Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY),
      airtelConfigured: Boolean(
        process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET
      ),
      redisConfigured: Boolean(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      appUrl: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "",
    },
  });
}

export async function PATCH(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });

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
    if (key === "delivery_fee_rwf") {
      const fee = Number(value);
      if (Number.isFinite(fee) && fee >= 0) await syncAllZoneFees(fee);
    }
    await auditAdminAction(req, session, {
      action: "settings.update",
      entity: "WebsiteSetting",
      details: `${key}=${value}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "settings_bulk") {
    const entries = (body.settings || {}) as Record<string, string>;
    await setSettingsBulk(entries);
    if (entries.delivery_fee_rwf != null) {
      const fee = Number(entries.delivery_fee_rwf);
      if (Number.isFinite(fee) && fee >= 0) await syncAllZoneFees(fee);
    }
    await auditAdminAction(req, session, {
      action: "settings.bulk_update",
      entity: "WebsiteSetting",
      details: Object.keys(entries).join(", "),
    });
    return NextResponse.json({ ok: true, settings: await getAdminSettingsBundle() });
  }

  if (action === "zone") {
    const { id, feeRwf, labelEn, isActive, etaMinutes, etaLabelEn } = body as {
      id?: string;
      feeRwf?: number;
      labelEn?: string;
      isActive?: boolean;
      etaMinutes?: number;
      etaLabelEn?: string;
    };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const updated = await prisma.deliveryZoneConfig.update({
      where: { id },
      data: {
        ...(feeRwf !== undefined ? { feeRwf: Number(feeRwf) } : {}),
        ...(labelEn !== undefined ? { labelEn: String(labelEn) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(etaMinutes !== undefined ? { etaMinutes: Number(etaMinutes) } : {}),
        ...(etaLabelEn !== undefined ? { etaLabelEn: String(etaLabelEn) } : {}),
      },
    });
    await auditAdminAction(req, session, {
      action: "delivery_zone.update",
      entity: "DeliveryZoneConfig",
      entityId: id,
      details: JSON.stringify({ feeRwf, labelEn, isActive, etaMinutes, etaLabelEn }),
    });
    return NextResponse.json(updated);
  }

  if (action === "sync_delivery_fee") {
    const fee = Number(body.feeRwf);
    if (!Number.isFinite(fee) || fee < 0) {
      return NextResponse.json({ error: "Invalid fee" }, { status: 400 });
    }
    await setSetting("delivery_fee_rwf", String(Math.round(fee)));
    await syncAllZoneFees(fee);
    await auditAdminAction(req, session, {
      action: "settings.sync_delivery_fee",
      entity: "DeliveryZoneConfig",
      details: `feeRwf=${fee}`,
    });
    return NextResponse.json({ ok: true, feeRwf: Math.round(fee) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
