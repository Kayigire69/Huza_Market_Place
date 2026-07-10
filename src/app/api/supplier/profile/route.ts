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
      businessName: body.businessName ?? undefined,
      description: body.description ?? undefined,
      location: body.location ?? undefined,
      district: body.district ?? undefined,
      sector: body.sector ?? undefined,
      phone: body.phone ?? undefined,
      email: body.email ?? undefined,
      nationalId: body.nationalId ?? undefined,
      companyRegNo: body.companyRegNo ?? undefined,
      tin: body.tin ?? undefined,
      farmSize: body.farmSize ?? undefined,
      productionCapacity: body.productionCapacity ?? undefined,
      productCategories: body.productCategories ?? undefined,
      paymentMomo: body.paymentMomo ?? undefined,
      bankAccount: body.bankAccount ?? undefined,
      bankName: body.bankName ?? undefined,
      nationalIdUrl: body.nationalIdUrl ?? undefined,
      businessCertUrl: body.businessCertUrl ?? undefined,
      tinDocUrl: body.tinDocUrl ?? undefined,
      foodSafetyUrl: body.foodSafetyUrl ?? undefined,
      organicCertUrl: body.organicCertUrl ?? undefined,
      permitUrl: body.permitUrl ?? undefined,
      documentsUrl: body.documentsUrl ?? undefined,
      availability: body.availability
        ? (body.availability as AvailabilityStatus)
        : undefined,
      openHour: body.openHour !== undefined ? Number(body.openHour) : undefined,
      closeHour: body.closeHour !== undefined ? Number(body.closeHour) : undefined,
    },
  });

  return NextResponse.json(updated);
}
