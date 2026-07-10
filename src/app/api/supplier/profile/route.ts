import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityStatus } from "@prisma/client";
import { pickFarmerDossier } from "@/lib/farmer-dossier";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const id = supplier?.id ?? body.supplierId;
  if (!id) return NextResponse.json({ error: "Farmer required" }, { status: 400 });

  const dossier = pickFarmerDossier(body);
  const cleaned = Object.fromEntries(
    Object.entries(dossier).filter(([, v]) => v !== undefined && !(typeof v === "number" && Number.isNaN(v)))
  );

  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      ...cleaned,
      availability: body.availability
        ? (body.availability as AvailabilityStatus)
        : undefined,
      openHour: body.openHour !== undefined ? Number(body.openHour) : undefined,
      closeHour: body.closeHour !== undefined ? Number(body.closeHour) : undefined,
    },
  });

  if (body.fullName && supplier) {
    await prisma.user.update({
      where: { id: supplier.userId },
      data: { fullName: String(body.fullName) },
    });
  }

  return NextResponse.json(updated);
}
