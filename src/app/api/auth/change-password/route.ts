import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

/** Change password — clears mustChangePassword (forced first login for Super Admin). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Forced change still requires knowing the temporary password
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "Choose a new password different from the temporary one" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: user.id,
    actorName: user.fullName,
    actorEmail: user.email,
    action: "auth.password_change",
    entity: "User",
    entityId: user.id,
    details: user.mustChangePassword ? "Forced first-login password change" : "Password updated",
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, mustChangePassword: false });
}
