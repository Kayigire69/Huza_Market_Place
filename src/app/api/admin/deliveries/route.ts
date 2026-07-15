import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";
import { ZONE_ETA_MINUTES } from "@/lib/delivery-eta";
import type { DeliveryZoneKey } from "@/lib/utils";

async function requireAdmin() {
  return requireAdminSession({ modules: ["deliveries"] });
}

const TAB_STATUS: Record<string, OrderStatus[]> = {
  pending: [
    "PENDING",
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "PACKED",
    "READY_FOR_DISPATCH",
    "READY_FOR_PICKUP",
  ],
  assigned: ["READY_FOR_DISPATCH", "READY_FOR_PICKUP", "PACKED"],
  on_way: ["OUT_FOR_DELIVERY"],
  delivered: ["DELIVERED"],
  failed: ["RETURNED", "CANCELLED"],
};

const orderSelect = {
  orderNumber: true,
  total: true,
  deliveryAddress: true,
  deliveryDistrict: true,
  deliverySector: true,
  deliveryZone: true,
  deliveryInstructions: true,
  deliveryFee: true,
  estimatedDelivery: true,
  gpsLat: true,
  gpsLng: true,
  guestName: true,
  guestPhone: true,
  status: true,
  createdAt: true,
  user: { select: { fullName: true, phone: true } },
  items: {
    take: 12,
    select: {
      quantity: true,
      product: { select: { nameEn: true } },
    },
  },
} as const;

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "pending";
  const q = searchParams.get("q")?.trim() || "";
  const zone = searchParams.get("zone") || "";
  const driverId = searchParams.get("driverId") || "";
  const id = searchParams.get("id");

  if (id) {
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: { select: orderSelect },
        deliveryPerson: { select: { id: true, fullName: true, phone: true } },
        vehicle: { select: { id: true, plateNumber: true, label: true } },
      },
    });
    if (!delivery) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ delivery });
  }

  let where: Record<string, unknown> = {};

  if (tab === "pending") {
    where = { status: { in: TAB_STATUS.pending }, deliveryPersonId: null };
  } else if (tab === "assigned") {
    where = { status: { in: TAB_STATUS.assigned }, deliveryPersonId: { not: null } };
  } else if (tab === "on_way") {
    where = { status: { in: TAB_STATUS.on_way } };
  } else if (tab === "delivered") {
    where = { status: { in: TAB_STATUS.delivered } };
  } else if (tab === "failed") {
    where = { status: { in: TAB_STATUS.failed } };
  }

  const and: Record<string, unknown>[] = [where];

  if (driverId && tab !== "pending") {
    and.push({ deliveryPersonId: driverId });
  }

  if (zone) {
    and.push({ order: { deliveryZone: zone } });
  }

  if (q) {
    and.push({
      OR: [
        { routeNotes: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        {
          order: {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { deliveryAddress: { contains: q, mode: "insensitive" } },
              { guestName: { contains: q, mode: "insensitive" } },
              { guestPhone: { contains: q, mode: "insensitive" } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
              { user: { phone: { contains: q, mode: "insensitive" } } },
            ],
          },
        },
        { deliveryPerson: { fullName: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const finalWhere = and.length === 1 ? and[0] : { AND: and };

  const [deliveries, driversRaw, vehicles, counts] = await Promise.all([
    prisma.delivery.findMany({
      where: finalWhere,
      include: {
        order: { select: orderSelect },
        deliveryPerson: { select: { id: true, fullName: true, phone: true } },
        vehicle: { select: { id: true, plateNumber: true, label: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "DELIVERY", isActive: true },
      select: {
        id: true,
        fullName: true,
        phone: true,
        deliveries: {
          where: {
            status: {
              in: ["READY_FOR_DISPATCH", "READY_FOR_PICKUP", "PACKED", "OUT_FOR_DELIVERY"],
            },
          },
          select: {
            id: true,
            status: true,
            order: { select: { deliveryZone: true } },
          },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.vehicle.findMany({
      where: { isActive: true },
      select: { id: true, plateNumber: true, label: true, capacityKg: true },
      orderBy: { label: "asc" },
    }),
    Promise.all([
      prisma.delivery.count({
        where: { status: { in: TAB_STATUS.pending }, deliveryPersonId: null },
      }),
      prisma.delivery.count({
        where: { status: { in: TAB_STATUS.assigned }, deliveryPersonId: { not: null } },
      }),
      prisma.delivery.count({ where: { status: { in: TAB_STATUS.on_way } } }),
      prisma.delivery.count({ where: { status: { in: TAB_STATUS.delivered } } }),
      prisma.delivery.count({ where: { status: { in: TAB_STATUS.failed } } }),
    ]),
  ]);

  const drivers = driversRaw.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    phone: d.phone,
    activeCount: d.deliveries.length,
    onWayCount: d.deliveries.filter((x) => x.status === "OUT_FOR_DELIVERY").length,
    zones: [...new Set(d.deliveries.map((x) => x.order.deliveryZone))],
  }));

  return NextResponse.json({
    deliveries,
    drivers,
    vehicles,
    counts: {
      pending: counts[0],
      assigned: counts[1],
      on_way: counts[2],
      delivered: counts[3],
      failed: counts[4],
    },
  });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    deliveryId,
    deliveryPersonId,
    vehicleId,
    status,
    routeNotes,
    estimatedMinutes,
    podNotes,
    podPhotoUrl,
    failReason,
    unassign,
  } = body;

  const before = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: { select: { orderNumber: true, userId: true, deliveryZone: true } },
      deliveryPerson: { select: { fullName: true } },
    },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStatus = status as OrderStatus | undefined;
  let notesPatch: string | undefined;

  if (nextStatus === "RETURNED" || nextStatus === "CANCELLED") {
    notesPatch = failReason
      ? `Failed: ${failReason}`
      : before.notes || "Delivery failed / returned";
  }

  const zone = before.order.deliveryZone as DeliveryZoneKey;
  const defaultEta = ZONE_ETA_MINUTES[zone];

  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      deliveryPersonId: unassign
        ? null
        : deliveryPersonId !== undefined
          ? deliveryPersonId || null
          : undefined,
      vehicleId: vehicleId !== undefined ? vehicleId || null : undefined,
      status: nextStatus || undefined,
      routeNotes: routeNotes !== undefined ? String(routeNotes) : undefined,
      estimatedMinutes:
        estimatedMinutes !== undefined
          ? Number(estimatedMinutes) || null
          : deliveryPersonId && !before.estimatedMinutes
            ? defaultEta
            : undefined,
      podNotes: podNotes !== undefined ? String(podNotes) : undefined,
      podPhotoUrl: podPhotoUrl !== undefined ? String(podPhotoUrl) : undefined,
      notes: notesPatch,
      pickedAt: nextStatus === "OUT_FOR_DELIVERY" ? new Date() : undefined,
      deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
    },
    include: {
      order: { select: orderSelect },
      deliveryPerson: { select: { id: true, fullName: true, phone: true } },
      vehicle: { select: { id: true, plateNumber: true, label: true } },
    },
  });

  /** Assigning a driver should land them in the Assigned pipeline */
  if (deliveryPersonId && !nextStatus) {
    const readyStatuses: OrderStatus[] = [
      "PENDING",
      "PAID",
      "CONFIRMED",
      "PREPARING",
      "PACKED",
    ];
    if (readyStatuses.includes(before.status)) {
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: "READY_FOR_DISPATCH" },
      });
      await prisma.order.update({
        where: { id: before.orderId ?? delivery.orderId },
        data: {
          status: "READY_FOR_DISPATCH",
          statusLog: {
            create: {
              status: "READY_FOR_DISPATCH",
              note: `Assigned to ${delivery.deliveryPerson?.fullName || "driver"} by ${session.user.name || session.user.email}`,
            },
          },
        },
      });
    }
  }

  if (nextStatus) {
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        status: nextStatus,
        statusLog: {
          create: {
            status: nextStatus,
            note:
              nextStatus === "RETURNED" || nextStatus === "CANCELLED"
                ? notesPatch || `Delivery failed by ${session.user.name || session.user.email}`
                : `Delivery update by ${session.user.name || session.user.email}`,
          },
        },
      },
    });

    if (before.order.userId) {
      const failed = nextStatus === "RETURNED" || nextStatus === "CANCELLED";
      await prisma.notification.create({
        data: {
          userId: before.order.userId,
          type: failed
            ? "DELIVERY_UPDATE"
            : nextStatus === "DELIVERED"
              ? "ORDER_DELIVERED"
              : nextStatus === "OUT_FOR_DELIVERY"
                ? "ORDER_OUT_FOR_DELIVERY"
                : "DELIVERY_UPDATE",
          channel: "IN_APP",
          title: failed
            ? "Delivery issue"
            : nextStatus === "DELIVERED"
              ? "Order delivered"
              : nextStatus === "OUT_FOR_DELIVERY"
                ? "Out for delivery"
                : "Delivery update",
          body: failed
            ? `Order ${before.order.orderNumber}: ${notesPatch}`
            : `Order ${before.order.orderNumber} is now ${nextStatus.replace(/_/g, " ").toLowerCase()}.`,
        },
      });
    }
  }

  if (deliveryPersonId && delivery.deliveryPersonId) {
    await prisma.notification.create({
      data: {
        userId: delivery.deliveryPersonId,
        type: "DELIVERY_SCHEDULE",
        channel: "IN_APP",
        title: "New delivery assigned",
        body: `You were assigned order ${before.order.orderNumber}.`,
      },
    });
  }

  await auditAdminAction(req, session, {
    action: unassign
      ? "delivery.unassign"
      : deliveryPersonId
        ? "delivery.assign"
        : nextStatus === "RETURNED" || nextStatus === "CANCELLED"
          ? "delivery.failed"
          : "delivery.status_change",
    entity: "Delivery",
    entityId: delivery.id,
    details: `${before.order.orderNumber}: driver=${delivery.deliveryPerson?.fullName || "—"} status=${delivery.status}`,
    before: {
      status: before.status,
      deliveryPersonId: before.deliveryPersonId,
      driver: before.deliveryPerson?.fullName || null,
    },
    after: {
      status: delivery.status,
      deliveryPersonId: delivery.deliveryPersonId,
      driver: delivery.deliveryPerson?.fullName || null,
      vehicleId: delivery.vehicleId,
    },
  });

  return NextResponse.json(delivery);
}
