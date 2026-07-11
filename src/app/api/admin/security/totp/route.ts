import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";
import { generateTotpSecret, totpQrDataUrl, verifyTotp } from "@/lib/security";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) return null;
  return session;
}

/** Start 2FA setup — returns QR for authenticator apps. */
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    totpEnabled: user.totpEnabled,
    email: user.email,
  });
}

export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const body = await req.json();
  const action = String(body.action || "");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.email) {
    return NextResponse.json({ error: "Super Admin must have an email for 2FA" }, { status: 400 });
  }

  if (action === "begin") {
    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
    const qrDataUrl = await totpQrDataUrl(user.email, secret);
    return NextResponse.json({ secret, qrDataUrl });
  }

  if (action === "confirm") {
    const code = String(body.code || "");
    if (!user.totpSecret || !verifyTotp(code, user.totpSecret)) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    });
    await auditAdminAction(req, session, {
      action: "security.totp_enable",
      entity: "User",
      entityId: user.id,
      details: "Two-factor authentication enabled",
    });
    return NextResponse.json({ ok: true, totpEnabled: true });
  }

  if (action === "disable") {
    const code = String(body.code || "");
    if (!user.totpSecret || !user.totpEnabled || !verifyTotp(code, user.totpSecret)) {
      return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null },
    });
    await auditAdminAction(req, session, {
      action: "security.totp_disable",
      entity: "User",
      entityId: user.id,
      details: "Two-factor authentication disabled",
    });
    return NextResponse.json({ ok: true, totpEnabled: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
