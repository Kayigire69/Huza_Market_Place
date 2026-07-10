import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, fullAddress, district } = await req.json();
  if (!fullAddress) return NextResponse.json({ error: "Address required" }, { status: 400 });

  await prisma.address.create({
    data: {
      userId: session.user.id,
      label: label || "Home",
      fullAddress,
      district: district || null,
    },
  });

  return NextResponse.json({ ok: true });
}
