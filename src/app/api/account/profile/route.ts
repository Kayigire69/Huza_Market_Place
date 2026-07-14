import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!fullName && !phone) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (phone) {
    const taken = await prisma.user.findFirst({
      where: { phone, NOT: { id: session.user.id } },
      select: { id: true },
    });
    if (taken) return NextResponse.json({ error: "Phone already in use" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(fullName ? { fullName } : {}),
      ...(phone ? { phone } : {}),
    },
    select: { id: true, fullName: true, phone: true, email: true, loyaltyPoints: true },
  });

  return NextResponse.json(user);
}
