import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim() || null;
  const phone = String(body.phone || "").trim() || null;
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!fullName || !subject || !message) {
    return NextResponse.json({ error: "Name, subject and message are required" }, { status: 400 });
  }

  await prisma.contactMessage.create({
    data: {
      fullName,
      email,
      phone,
      subject,
      message,
    },
  });

  return NextResponse.json({ ok: true });
}
