import { NextResponse } from "next/server";
import { OrderStatus, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWarehouseSession } from "@/lib/rbac-server";

function receiptNumber() {
  return `GR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

async function handleAction(
  session: { user: { id: string; name?: string | null } },
  body: Record<string, unknown>
) {
  const action = String(body.action || "");

  if (action === "receive") {
    const productId = String(body.productId || "");
    const qty = Math.floor(Number(body.qty) || 0);
    const batchNumber = String(body.batchNumber || "").trim();
    const locationCode = body.locationCode ? String(body.locationCode).trim() : null;
    const damageQty = Math.max(0, Math.floor(Number(body.damage) || 0));
    const purchaseOrderId = body.purchaseOrderId ? String(body.purchaseOrderId) : null;
    const notes = body.notes ? String(body.notes) : null;
    const expiry = body.expiry ? new Date(String(body.expiry)) : null;
    const { normalizeOfficialImageUrls, publishOfficialProductImages } = await import(
      "@/lib/official-product-images"
    );
    const officialImageUrls = normalizeOfficialImageUrls(body.officialImageUrls ?? body.imageUrls);

    if (!productId || qty <= 0 || !batchNumber) {
      return NextResponse.json(
        { error: "productId, qty, and batchNumber are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let locationId: string | null = null;
    if (locationCode) {
      const loc = await prisma.warehouseLocation.upsert({
        where: { code: locationCode },
        create: { code: locationCode, name: locationCode },
        update: {},
      });
      locationId = loc.id;
    }

    const goodQty = Math.max(0, qty - damageQty);

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber: receiptNumber(),
          purchaseOrderId,
          supplierId: product.supplierId,
          receivedById: session.user.id,
          notes,
          damageNotes: damageQty > 0 ? `Damaged qty: ${damageQty}` : null,
          items: {
            create: {
              productId: product.id,
              productName: product.nameEn,
              quantity: qty,
              unit: product.unit,
              batchNumber,
              expiryDate: expiry,
              damagedQty: damageQty,
              locationCode,
            },
          },
        },
        include: { items: true },
      });

      if (goodQty > 0) {
        const batch = await tx.stockBatch.create({
          data: {
            productId: product.id,
            batchNumber,
            quantity: goodQty,
            expiryDate: expiry,
            locationId,
            notes: notes || undefined,
            officialImageUrls,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: StockMovementType.RECEIVE,
            quantity: goodQty,
            reason: `Goods receipt ${receipt.receiptNumber}`,
            actorId: session.user.id,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { increment: goodQty } },
        });

        await tx.stockHistory.create({
          data: {
            productId: product.id,
            change: goodQty,
            reason: `Receive ${receipt.receiptNumber} batch ${batchNumber}`,
          },
        });

        if (damageQty > 0) {
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: StockMovementType.DAMAGE,
              quantity: damageQty,
              reason: `Damaged on receive ${receipt.receiptNumber}`,
              actorId: session.user.id,
            },
          });
        }

        if (purchaseOrderId) {
          await tx.purchaseOrder.update({
            where: { id: purchaseOrderId },
            data: { status: "RECEIVED", receivedAt: new Date() },
          });
        }

        return { receipt, batchId: batch.id };
      }

      if (damageQty > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: StockMovementType.DAMAGE,
            quantity: damageQty,
            reason: `Damaged on receive ${receipt.receiptNumber}`,
            actorId: session.user.id,
          },
        });
      }

      if (purchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: "RECEIVED", receivedAt: new Date() },
        });
      }

      return { receipt, batchId: null as string | null };
    });

    if (officialImageUrls.length > 0 && result.batchId) {
      await publishOfficialProductImages({
        productId: product.id,
        imageUrls: officialImageUrls,
        productName: product.nameEn,
        batchId: result.batchId,
      });
    }

    return NextResponse.json(result.receipt);
  }

  if (action === "pack" || action === "ready_for_dispatch") {
    const orderId = String(body.orderId || "");
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const status: OrderStatus =
      action === "pack" ? OrderStatus.PACKED : OrderStatus.READY_FOR_DISPATCH;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        packedAt: action === "pack" ? new Date() : undefined,
        statusLog: {
          create: {
            status,
            note: action === "pack" ? "Packed by warehouse" : "Ready for dispatch",
          },
        },
        delivery:
          action === "ready_for_dispatch"
            ? {
                upsert: {
                  create: { status: OrderStatus.READY_FOR_DISPATCH },
                  update: { status: OrderStatus.READY_FOR_DISPATCH },
                },
              }
            : undefined,
      },
      include: { delivery: true },
    });

    if (order.userId) {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: action === "pack" ? "ORDER_PACKED" : "DELIVERY_UPDATE",
          channel: "IN_APP",
          title: action === "pack" ? "Order packed" : "Ready for dispatch",
          body: `Order ${order.orderNumber} is now ${status}.`,
        },
      });
    }

    return NextResponse.json(order);
  }

  if (action === "damage") {
    const productId = String(body.productId || "");
    const qty = Math.floor(Number(body.qty) || 0);
    const reason = body.reason ? String(body.reason) : "Warehouse damage";
    if (!productId || qty <= 0) {
      return NextResponse.json({ error: "productId and qty required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId,
          type: StockMovementType.DAMAGE,
          quantity: qty,
          reason,
          actorId: session.user.id,
        },
      });
      await tx.stockHistory.create({
        data: { productId, change: -qty, reason },
      });
      return tx.product.update({
        where: { id: productId },
        data: { stockQty: { decrement: qty } },
      });
    });

    return NextResponse.json(updated);
  }

  if (action === "count") {
    const productId = String(body.productId || "");
    const countedQty = Math.floor(Number(body.qty) || 0);
    const reason = body.reason ? String(body.reason) : "Stock count adjustment";
    if (!productId || countedQty < 0) {
      return NextResponse.json({ error: "productId and qty required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const delta = countedQty - product.stockQty;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId,
          type: StockMovementType.COUNT,
          quantity: Math.abs(delta),
          reason: `${reason} (was ${product.stockQty}, counted ${countedQty})`,
          actorId: session.user.id,
        },
      });
      await tx.stockHistory.create({
        data: {
          productId,
          change: delta,
          reason: `${reason} → ${countedQty}`,
        },
      });
      return tx.product.update({
        where: { id: productId },
        data: { stockQty: countedQty },
      });
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await requireWarehouseSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handleAction(session, await req.json());
}

export async function PATCH(req: Request) {
  const session = await requireWarehouseSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handleAction(session, await req.json());
}
