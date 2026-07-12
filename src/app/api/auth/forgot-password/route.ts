import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { hashToken, randomToken } from "@/lib/security";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { enqueueEmail } from "@/jobs/queue";

/** Request a password reset link (works for Super Admin and any user with email). */
export async function POST(req: Request) {
  const rl = await rateLimit({
    key: `forgot:${clientIp(req)}`,
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { email } = await req.json();
  const identifier = String(email || "").trim().toLowerCase();
  if (!identifier) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Always return ok to avoid account enumeration
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: identifier, mode: "insensitive" },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, email: true, fullName: true },
  });

  if (user?.email) {
    const raw = randomToken();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${base}/auth/reset-password/${raw}`;
    const subject = "Reset your HUZA account password";
    const text = `Hello ${user.fullName},\n\nReset your password using this link (valid 1 hour):\n${link}\n\nIf you did not request this, ignore this email.`;

    // Production mail provider: queue so the HTTP response stays fast.
    if (process.env.RESEND_API_KEY) {
      await enqueueEmail(user.email, subject, text);
    } else {
      // Console-only mode: keep sync send so local recoveryLink still works.
      const sent = await sendEmail({ to: user.email, subject, text });
      if (sent.mode === "console") {
        return NextResponse.json({
          ok: true,
          message:
            "Email is not configured on this server, so here is your one-time reset link (valid 1 hour):",
          recoveryLink: link,
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If that email is registered, a reset link has been sent.",
  });
}
