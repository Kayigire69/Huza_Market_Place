import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, phone, isActive: true },
    update: { isActive: true, ...(phone ? { phone } : {}) },
  });

  return NextResponse.json({ ok: true, id: subscriber.id });
}
