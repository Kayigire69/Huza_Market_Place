import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageStaff } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { publishOfficialCatalogProducts } from "@/services/catalog-restore.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageStaff(session.user.role)) return null;
  if (session.user.mustChangePassword) return null;
  return session;
}

/** Super Admin — add official catalog products to the shop as new/active listings. */
export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (String(body.confirm || "").trim() !== "ADD") {
    return NextResponse.json(
      { error: 'Type confirm: "ADD" to publish catalog products' },
      { status: 400 }
    );
  }

  try {
    const result = await publishOfficialCatalogProducts(prisma);
    await auditAdminAction(req, session, {
      action: "catalog.publish_official",
      entity: "Product",
      details: `created ${result.created}, updated ${result.updated}, shop ${result.beforeShopVisible} → ${result.afterShopVisible}`,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
