import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnitType } from "@prisma/client";

async function getSupplierId(userId: string, role?: string) {
  const supplier = await prisma.supplier.findUnique({ where: { userId } });
  if (supplier) return supplier.id;
  if (role === "ADMIN") {
    const first = await prisma.supplier.findFirst({ where: { status: "APPROVED" } });
    return first?.id ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplierId = await getSupplierId(session.user.id, session.user.role);
  if (!supplierId) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (supplier?.status !== "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Supplier not approved yet" }, { status: 403 });
  }

  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      supplierId,
      categoryId: body.categoryId,
      nameEn: body.nameEn,
      nameFr: body.nameFr || body.nameEn,
      nameRw: body.nameRw || body.nameEn,
      descriptionEn: body.descriptionEn || "",
      descriptionFr: body.descriptionFr || body.descriptionEn || "",
      descriptionRw: body.descriptionRw || body.descriptionEn || "",
      price: Number(body.price),
      unit: (body.unit as UnitType) || UnitType.KG,
      stockQty: Number(body.stockQty) || 0,
      isOrganic: Boolean(body.isOrganic),
      isNewArrival: true,
      location: supplier?.location,
      images: {
        create: [{ url: "/images/products/mushroom.svg", alt: body.nameEn }],
      },
      stockLogs: {
        create: { change: Number(body.stockQty) || 0, reason: "Initial upload" },
      },
    },
  });

  return NextResponse.json(product);
}
