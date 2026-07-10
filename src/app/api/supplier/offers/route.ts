import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnitType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ error: "Supplier profile not found" }, { status: 404 });
  if (supplier.status !== "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Partner not approved yet" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title || !body.askPrice || !body.quantityOffered) {
    return NextResponse.json({ error: "Title, quantity and ask price required" }, { status: 400 });
  }

  const offer = await prisma.supplierOffer.create({
    data: {
      supplierId: supplier.id,
      categoryId: body.categoryId || null,
      title: body.title,
      description: body.description || null,
      unit: (body.unit as UnitType) || UnitType.KG,
      quantityOffered: Number(body.quantityOffered),
      askPrice: Number(body.askPrice),
      suggestedRetail: body.suggestedRetail ? Number(body.suggestedRetail) : null,
      availableDistricts: body.availableDistricts || [],
      status: "PENDING",
    },
  });

  return NextResponse.json(offer);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const offers = await prisma.supplierOffer.findMany({
      include: { supplier: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ offers });
  }

  const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
  if (!supplier) return NextResponse.json({ offers: [] });

  const offers = await prisma.supplierOffer.findMany({
    where: { supplierId: supplier.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ offers });
}
