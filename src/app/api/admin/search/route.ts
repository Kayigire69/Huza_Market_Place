import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/search?q= — global admin search across products, orders, farmers, customers */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [products, orders, farmers, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameRw: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { id: true, nameEn: true, price: true },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { guestName: { contains: q, mode: "insensitive" } },
          { guestPhone: { contains: q } },
        ],
      },
      take: 6,
      select: { id: true, orderNumber: true, status: true, total: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({
      where: {
        OR: [
          { businessName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      take: 6,
      select: { id: true, businessName: true, status: true },
    }),
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { id: true, fullName: true, phone: true },
    }),
  ]);

  const results = [
    ...orders.map((o) => ({
      type: "order" as const,
      id: o.id,
      label: o.orderNumber,
      sub: `${o.status} · ${o.total} RWF`,
      href: `/admin/orders?q=${encodeURIComponent(o.orderNumber)}`,
    })),
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      label: p.nameEn,
      sub: `${p.price} RWF`,
      href: `/admin/products?q=${encodeURIComponent(p.nameEn)}`,
    })),
    ...farmers.map((f) => ({
      type: "farmer" as const,
      id: f.id,
      label: f.businessName,
      sub: f.status,
      href: `/admin/suppliers?q=${encodeURIComponent(f.businessName)}`,
    })),
    ...customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      label: c.fullName,
      sub: c.phone,
      href: `/admin/customers?q=${encodeURIComponent(c.phone || c.fullName)}`,
    })),
  ];

  return NextResponse.json({ results });
}
