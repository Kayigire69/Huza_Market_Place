import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WarehouseClient } from "./WarehouseClient";
import { PortalCopyright } from "@/components/portals/PortalCopyright";

export const dynamic = "force-dynamic";

export default async function WarehousePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (
    session.user.role !== "WAREHOUSE" &&
    session.user.role !== "INVENTORY" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "MANAGER"
  ) {
    redirect("/account");
  }

  const [candidates, packOrders, products, movements, locations] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        // Pre-filter closer to low-stock threshold (same UI filter applied below)
        stockQty: { lte: 50 },
      },
      select: {
        id: true,
        nameEn: true,
        stockQty: true,
        lowStockAt: true,
        unit: true,
        barcode: true,
      },
      orderBy: { stockQty: "asc" },
      take: 80,
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "CONFIRMED", "PREPARING", "PACKED", "READY_FOR_DISPATCH"] },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deliveryAddress: true,
        guestName: true,
        guestPhone: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: { select: { nameEn: true, unit: true } },
          },
        },
        user: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, nameEn: true, stockQty: true, unit: true },
      orderBy: { nameEn: "asc" },
      take: 200,
    }),
    prisma.stockMovement.findMany({
      select: {
        id: true,
        type: true,
        quantity: true,
        reason: true,
        createdAt: true,
        product: { select: { nameEn: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.warehouseLocation.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const lowStock = candidates.filter((p) => p.stockQty <= p.lowStockAt).slice(0, 40);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
        Staff portal
      </p>
      <h1 className="section-title mt-1">Warehouse</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Receive goods, pack orders, and track stock movements for HUZA FRESH.
      </p>
      <WarehouseClient
        lowStock={lowStock}
        packOrders={packOrders}
        products={products}
        movements={movements}
        locations={locations}
      />
      <PortalCopyright suffix="Warehouse" />
    </div>
  );
}
