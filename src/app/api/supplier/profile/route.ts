import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityStatus } from "@prisma/client";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const id = supplier?.id ?? body.supplierId;
  if (!id) return NextResponse.json({ error: "Supplier required" }, { status: 400 });

  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      businessName: body.businessName,
      description: body.description,
      location: body.location,
      district: body.district,
      phone: body.phone,
      availability: body.availability as AvailabilityStatus,
      openHour: Number(body.openHour),
      closeHour: Number(body.closeHour),
    },
  });

  return NextResponse.json(updated);
}
