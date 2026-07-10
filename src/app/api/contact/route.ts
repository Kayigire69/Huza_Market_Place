import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { fullName, email, phone, subject, message } = await req.json();
  if (!fullName || !subject || !message) {
    return NextResponse.json({ error: "Name, subject and message are required" }, { status: 400 });
  }

  await prisma.contactMessage.create({
    data: {
      fullName,
      email: email || null,
      phone: phone || null,
      subject,
      message,
    },
  });

  return NextResponse.json({ ok: true });
}
