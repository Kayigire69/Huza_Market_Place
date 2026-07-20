import { NextResponse } from "next/server";
import type { RestockRequestStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { availableQty } from "@/repositories/product.repository";
import { stockPercentLeft } from "@/lib/stock-alerts";

async function requireAdmin() {
  return requireAdminSession({ modules: ["inventory"] });
}

const STATUSES: RestockRequestStatus[] = ["OPEN", "SOURCING", "FULFILLED", "CLOSED"];

export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "OPEN";
  const take = Math.min(Number(url.searchParams.get("take")) || 50, 100);

  const where =
    status === "ALL"
      ? {}
      : STATUSES.includes(status as RestockRequestStatus)
        ? { status: status as RestockRequestStatus }
        : { status: "OPEN" as const };

  const [items, counts] = await Promise.all([
    prisma.restockRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            unit: true,
            stockQty: true,
            reservedQty: true,
            lowStockAt: true,
          },
        },
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
    prisma.restockRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Record<
    string,
    number
  >;

  return NextResponse.json({
    items: items.map((r) => {
      const available = availableQty(r.product.stockQty, r.product.reservedQty);
      const percentLeft = stockPercentLeft(
        available,
        r.product.lowStockAt,
        r.product.stockQty,
        r.product.reservedQty
      );
      return {
        id: r.id,
        status: r.status,
        quantityWanted: r.quantityWanted,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        note: r.note,
        softEtaLabel: r.softEtaLabel,
        createdAt: r.createdAt,
        product: {
          id: r.product.id,
          nameEn: r.product.nameEn,
          unit: r.product.unit,
          available,
          percentLeft,
        },
        user: r.user,
      };
    }),
    counts: {
      OPEN: countMap.OPEN || 0,
      SOURCING: countMap.SOURCING || 0,
      FULFILLED: countMap.FULFILLED || 0,
      CLOSED: countMap.CLOSED || 0,
    },
  });
}

export async function PATCH(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const id = String((body as { id?: string }).id || "").trim();
  const status = String((body as { status?: string }).status || "").trim() as RestockRequestStatus;

  if (!id || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }

  const updated = await prisma.restockRequest.updateMany({
    where: { id },
    data: { status },
  });
  if (updated.count !== 1) {
    return NextResponse.json({ error: "Restock request not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: { id, status } });
}
