import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { supplier: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product.supplier.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stockQty =
    body.stockQty !== undefined && body.stockQty !== null
      ? Number(body.stockQty)
      : undefined;
  const change = stockQty !== undefined ? stockQty - product.stockQty : 0;

  const imageUrls = parseImageUrls(body);

  const updated = await prisma.$transaction(async (tx) => {
    if (imageUrls.length > 0) {
      // Farmers may only replace inspection photos — never customer storefront gallery
      await tx.productImage.deleteMany({ where: { productId: id, kind: "INSPECTION" } });
      await tx.productImage.createMany({
        data: imageUrls.map((url, i) => ({
          productId: id,
          url,
          alt: `${body.nameEn || product.nameEn} inspection ${i + 1}`,
          sortOrder: i,
          kind: "INSPECTION",
          isCover: false,
        })),
      });
    }

    const row = await tx.product.update({
      where: { id },
      data: {
        ...(body.nameEn ? { nameEn: body.nameEn, nameFr: body.nameEn, nameRw: body.nameEn } : {}),
        ...(body.descriptionEn !== undefined
          ? {
              descriptionEn: String(body.descriptionEn),
              descriptionFr: String(body.descriptionEn),
              descriptionRw: String(body.descriptionEn),
            }
          : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(stockQty !== undefined ? { stockQty } : {}),
        ...(body.isOrganic !== undefined ? { isOrganic: Boolean(body.isOrganic) } : {}),
      },
      include: {
        images: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] },
        category: true,
      },
    });

    if (stockQty !== undefined && change !== 0) {
      await tx.stockHistory.create({
        data: { productId: id, change, reason: "Manual inventory update" },
      });
    }

    return row;
  });

  return NextResponse.json(updated);
}
