import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const body = await req.json();
  const token = String(body.token || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!token) return NextResponse.json({ error: "Invalid reset link" }, { status: 400 });
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    actorId: record.userId,
    actorName: record.user.fullName,
    actorEmail: record.user.email,
    action: "auth.password_reset",
    entity: "User",
    entityId: record.userId,
    details: "Password reset via email link",
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
