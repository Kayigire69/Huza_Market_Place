import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageStaff } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { restoreStorefrontCatalog } from "@/services/catalog-restore.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageStaff(session.user.role)) return null;
  if (session.user.mustChangePassword) return null;
  return session;
}

/** Super Admin only — restore soft-deleted/hidden products onto the shop. */
export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (String(body.confirm || "").trim() !== "RESTORE") {
    return NextResponse.json(
      { error: 'Type confirm: "RESTORE" to run catalog restore' },
      { status: 400 }
    );
  }

  try {
    const result = await restoreStorefrontCatalog(prisma);
    await auditAdminAction(req, session, {
      action: "catalog.restore_storefront",
      entity: "Product",
      details: `shopVisible ${result.before.shopVisible} → ${result.after.shopVisible}`,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
