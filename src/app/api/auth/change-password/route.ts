import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { clearRateLimit, clientIp, rateLimit } from "@/lib/rate-limit";
import { BCRYPT_ROUNDS } from "@/lib/security-access";

/** Change password — required when mustChangePassword is set; otherwise optional. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit({
    key: `pwchange:${session.user.id}`,
    limit: 8,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
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
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  // Clear login lockouts so the next sign-in is not blocked
  const identifiers = [user.email, user.phone].filter(Boolean) as string[];
  await Promise.all(identifiers.map((id) => clearRateLimit(`login:${id.toLowerCase()}`)));

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
