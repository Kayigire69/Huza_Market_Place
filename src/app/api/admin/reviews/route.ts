import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action } = await req.json();
  if (action === "delete") {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  const review = await prisma.review.update({
    where: { id },
    data: action === "hide" ? { isHidden: true } : { isReported: true },
  });
  return NextResponse.json(review);
}
