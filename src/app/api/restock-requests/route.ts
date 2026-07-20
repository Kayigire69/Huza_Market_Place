import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { availableQty } from "@/repositories/product.repository";
import { notifyRestockDemand, SOFT_RESTOCK_ETA } from "@/lib/stock-alerts";

/** Customer (or guest) asks Huza to source a product that is unavailable. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const productId = String((body as { productId?: string }).productId || "").trim();
  const quantityWanted = Number((body as { quantityWanted?: number }).quantityWanted) || null;
  let customerName = String((body as { customerName?: string }).customerName || "").trim() || null;
  let customerPhone = String((body as { customerPhone?: string }).customerPhone || "").trim() || null;
  const note = String((body as { note?: string }).note || "").trim() || null;

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, isActive: true },
    select: {
      id: true,
      nameEn: true,
      stockQty: true,
      reservedQty: true,
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const available = availableQty(product.stockQty, product.reservedQty);
  if (available > 0) {
    return NextResponse.json(
      { error: "Product is available. Add it to cart instead", available },
      { status: 400 }
    );
  }

  const userId = session?.user?.id || null;
  if (userId && (!customerName || !customerPhone)) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, phone: true },
    });
    if (profile) {
      customerName = customerName || profile.fullName || null;
      customerPhone = customerPhone || profile.phone || null;
    }
  }

  const label =
    customerName ||
    (session?.user as { name?: string } | undefined)?.name ||
    customerPhone ||
    (userId ? "Signed-in customer" : "Guest");

  const created = await prisma.restockRequest.create({
    data: {
      productId: product.id,
      userId,
      quantityWanted:
        quantityWanted && quantityWanted > 0 ? Math.min(999, Math.trunc(quantityWanted)) : null,
      customerName:
        customerName || (session?.user as { name?: string } | undefined)?.name || null,
      customerPhone,
      note,
      softEtaLabel: SOFT_RESTOCK_ETA,
      status: "OPEN",
    },
  });

  const openCount = await prisma.restockRequest.count({
    where: { productId: product.id, status: { in: ["OPEN", "SOURCING"] } },
  });

  await notifyRestockDemand({
    productId: product.id,
    productName: product.nameEn,
    customerLabel: label,
    openCount,
  });

  return NextResponse.json({
    ok: true,
    id: created.id,
    softEtaLabel: SOFT_RESTOCK_ETA,
    openCount,
  });
}
