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

function parseImageUrls(body: Record<string, unknown>): string[] {
  const raw = body.imageUrls;
  if (Array.isArray(raw)) {
    return raw.map(String).map((u) => u.trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplierId = await getSupplierId(session.user.id, session.user.role);
  if (!supplierId) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { supplierId },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplierId = await getSupplierId(session.user.id, session.user.role);
  if (!supplierId) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (supplier?.status !== "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Farmer not approved yet" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.categoryId || !body.nameEn) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }

  const imageUrls = parseImageUrls(body);
  if (imageUrls.length === 0) {
    return NextResponse.json(
      { error: "Add at least one product photo so Huza agents can review it" },
      { status: 400 }
    );
  }

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
      isActive: false,
      location: supplier?.location,
      originDistrict: body.originDistrict || supplier?.district || null,
      images: {
        create: imageUrls.map((url, i) => ({
          url,
          alt: `${body.nameEn} photo ${i + 1}`,
          sortOrder: i,
        })),
      },
      stockLogs: {
        create: { change: Number(body.stockQty) || 0, reason: "Initial upload by farmer" },
      },
    },
    include: { images: true, category: true },
  });

  return NextResponse.json(product);
}
