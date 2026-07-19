import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityStatus } from "@prisma/client";
import { pickFarmerDossier } from "@/lib/farmer-dossier";
import { findSupplierForUser } from "@/lib/supplier-context";
import { isValidRwandaMomoPhone } from "@/lib/phone";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supplier = await findSupplierForUser(session.user.id);
  if (!supplier) {
    return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
  }

  const body = await req.json();
  const dossier = pickFarmerDossier(body);

  if (
    typeof dossier.paymentMomo === "string" &&
    dossier.paymentMomo.trim() &&
    !isValidRwandaMomoPhone(dossier.paymentMomo)
  ) {
    return NextResponse.json(
      { error: "Enter a valid MTN (078/079) or Airtel (072/073) MoMo number" },
      { status: 400 }
    );
  }

  const cleaned = Object.fromEntries(
    Object.entries(dossier).filter(
      ([k, v]) =>
        k !== "nationalId" && // National ID is set at registration; change via HUZA Support only
        v !== undefined &&
        !(typeof v === "number" && Number.isNaN(v))
    )
  );

  const updated = await prisma.supplier.update({
    where: { id: supplier.id },
    data: {
      ...cleaned,
      availability: body.availability
        ? (body.availability as AvailabilityStatus)
        : undefined,
      openHour: body.openHour !== undefined ? Number(body.openHour) : undefined,
      closeHour: body.closeHour !== undefined ? Number(body.closeHour) : undefined,
    },
  });

  if (body.fullName) {
    await prisma.user.update({
      where: { id: supplier.userId },
      data: { fullName: String(body.fullName) },
    });
  }

  return NextResponse.json(updated);
}
