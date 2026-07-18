import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { BCRYPT_ROUNDS } from "@/lib/security-access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit({
    key: `account-pw:${session.user.id}`,
    limit: 8,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (String(newPassword || "").length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
