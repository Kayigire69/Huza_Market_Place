import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";

async function requireAdmin() {
  return requireAdminSession({ modules: ["customers"] });
}

async function getSupportNotes(userId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ supportNotes: string | null }[]>`
    SELECT "supportNotes" FROM "User" WHERE id = ${userId} LIMIT 1
  `;
  return rows[0]?.supportNotes ?? null;
}

async function setSupportNotes(userId: string, notes: string | null) {
  await prisma.$executeRaw`
    UPDATE "User" SET "supportNotes" = ${notes} WHERE id = ${userId}
  `;
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const tab = searchParams.get("tab") || "all";
  const id = searchParams.get("id");

  if (id) {
    const customer = await prisma.user.findFirst({
      where: { id, role: "CUSTOMER" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        isActive: true,
        locale: true,
        loyaltyPoints: true,
        referralCode: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            label: true,
            fullAddress: true,
            district: true,
            sector: true,
            isDefault: true,
            gpsLat: true,
            gpsLng: true,
          },
        },
        favorites: {
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                nameEn: true,
                price: true,
                unit: true,
                isActive: true,
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            subtotal: true,
            deliveryFee: true,
            discountAmt: true,
            status: true,
            deliveryZone: true,
            deliveryAddress: true,
            createdAt: true,
            payment: {
              select: {
                method: true,
                status: true,
                amount: true,
                transactionRef: true,
                verifiedAt: true,
              },
            },
            items: {
              take: 8,
              select: {
                quantity: true,
                lineTotal: true,
                product: { select: { nameEn: true } },
              },
            },
          },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            type: true,
            adminReply: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true, favorites: true, addresses: true } },
      },
    });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [spentAgg, paidAgg, cancelledCount, supportNotes] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: id, status: { notIn: ["CANCELLED"] } },
        _sum: { total: true },
        _avg: { total: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          order: { userId: id },
          status: { in: ["VERIFIED", "CONFIRMED"] },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.order.count({
        where: { userId: id, status: "CANCELLED" },
      }),
      getSupportNotes(id),
    ]);

    const monthMap = new Map<string, number>();
    for (const o of customer.orders) {
      if (o.status === "CANCELLED") continue;
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + o.total);
    }
    const spendingByMonth = [...monthMap.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, total]) => ({ month, total }));

    return NextResponse.json({
      customer: {
        ...customer,
        supportNotes,
        stats: {
          ordersCount: customer._count.orders,
          favoritesCount: customer._count.favorites,
          addressesCount: customer._count.addresses,
          totalSpent: spentAgg._sum.total || 0,
          avgOrder: Math.round(spentAgg._avg.total || 0),
          paidTotal: paidAgg._sum.amount || 0,
          paidCount: paidAgg._count,
          cancelledCount,
        },
        spendingByMonth,
      },
    });
  }

  const search: Prisma.UserWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const activeFilter =
    tab === "active" ? { isActive: true } : tab === "inactive" ? { isActive: false } : {};

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", ...search, ...activeFilter },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      isActive: true,
      loyaltyPoints: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { orderNumber: true, total: true, createdAt: true, status: true },
      },
      _count: { select: { orders: true, favorites: true, addresses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  let notesById = new Map<string, string | null>();
  if (customers.length > 0) {
    try {
      const noteFlags = await prisma.$queryRaw<{ id: string; supportNotes: string | null }[]>`
        SELECT id, "supportNotes" FROM "User"
        WHERE id IN (${Prisma.join(customers.map((c) => c.id))})
      `;
      notesById = new Map(noteFlags.map((n) => [n.id, n.supportNotes]));
    } catch {
      notesById = new Map();
    }
  }

  const withSpend = await Promise.all(
    customers.map(async (c) => {
      const spent = await prisma.order.aggregate({
        where: {
          userId: c.id,
          status: { notIn: ["CANCELLED"] },
        },
        _sum: { total: true },
      });
      const notes = notesById.get(c.id);
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        isActive: c.isActive,
        loyaltyPoints: c.loyaltyPoints,
        hasNotes: Boolean(notes?.trim()),
        ordersCount: c._count.orders,
        favoritesCount: c._count.favorites,
        addressesCount: c._count.addresses,
        lastOrder: c.orders[0]
          ? {
              orderNumber: c.orders[0].orderNumber,
              total: c.orders[0].total,
              createdAt: c.orders[0].createdAt,
              status: c.orders[0].status,
            }
          : null,
        totalSpent: spent._sum.total || 0,
        createdAt: c.createdAt,
      };
    })
  );

  return NextResponse.json({ customers: withSpend });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id || "");
  const action = String(body.action || "save_notes");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "save_notes") {
    const supportNotes =
      body.supportNotes != null ? String(body.supportNotes).trim() || null : null;
    await setSupportNotes(id, supportNotes);
    await auditAdminAction(req, session, {
      action: "customer.save_notes",
      entity: "User",
      entityId: id,
      details: "Support notes updated",
    });
    return NextResponse.json({ id, supportNotes });
  }

  if (action === "activate" || action === "deactivate") {
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: action === "activate" },
    });
    await prisma.notification.create({
      data: {
        userId: id,
        type: "DELIVERY_UPDATE",
        channel: "IN_APP",
        title: action === "activate" ? "Account reactivated" : "Account deactivated",
        body:
          action === "activate"
            ? "Your HUZA FRESH account is active again."
            : "Your HUZA FRESH account was deactivated. Contact support if this is unexpected.",
      },
    });
    await auditAdminAction(req, session, {
      action: `customer.${action}`,
      entity: "User",
      entityId: id,
      details: `isActive=${updated.isActive}`,
    });
    return NextResponse.json(updated);
  }

  if (action === "notify") {
    const title = String(body.title || "Message from HUZA FRESH");
    const message = String(body.message || body.body || "");
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
    await prisma.notification.create({
      data: {
        userId: id,
        type: "DELIVERY_UPDATE",
        channel: "IN_APP",
        title,
        body: message,
      },
    });
    await auditAdminAction(req, session, {
      action: "customer.notify",
      entity: "User",
      entityId: id,
      details: title,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
