import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { SupplierStatus } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";

async function requireAdmin() {
  return requireAdminSession({ modules: ["farmers"] });
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const tab = searchParams.get("tab") || "pending";
  const q = searchParams.get("q")?.trim() || "";

  /** Full farmer profile for the View drawer */
  if (id) {
    const farmer = await prisma.supplier.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
        products: {
          where: { deletedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 40,
          select: {
            id: true,
            nameEn: true,
            price: true,
            stockQty: true,
            unit: true,
            isActive: true,
            reviewStatus: true,
            createdAt: true,
          },
        },
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            poNumber: true,
            productName: true,
            status: true,
            quantity: true,
            negotiatedPrice: true,
            totalAmount: true,
            paidAt: true,
            paymentRef: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
        offers: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            status: true,
            quantityOffered: true,
            askPrice: true,
            unit: true,
            createdAt: true,
          },
        },
        _count: { select: { products: true, purchaseOrders: true, offers: true } },
      },
    });
    if (!farmer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const productsApproved = farmer.products.filter((p) => p.reviewStatus === "APPROVED").length;
    const productsPending = farmer.products.filter((p) => p.reviewStatus === "PENDING").length;
    const paidOrders = farmer.purchaseOrders.filter((p) => p.status === "PAID");
    const totalPaid = paidOrders.reduce((s, p) => s + (p.totalAmount || 0), 0);

    return NextResponse.json({
      farmer: {
        id: farmer.id,
        businessName: farmer.businessName,
        fullName: farmer.user?.fullName || farmer.businessName,
        phone: farmer.phone || farmer.user?.phone,
        email: farmer.email || farmer.user?.email,
        district: farmer.district,
        sector: farmer.sector,
        location: farmer.location,
        province: farmer.province,
        status: farmer.status,
        farmingType: farmer.farmingType,
        farmSize: farmer.farmSize,
        ratingAvg: farmer.ratingAvg,
        ratingCount: farmer.ratingCount,
        isVerified: farmer.isVerified,
        verificationBadge: farmer.verificationBadge,
        paymentMomo: farmer.paymentMomo,
        bankAccount: farmer.bankAccount,
        bankName: farmer.bankName,
        paymentOption: farmer.paymentOption,
        adminNotes: farmer.adminNotes,
        rejectionReason: farmer.rejectionReason,
        inspectionScheduledAt: farmer.inspectionScheduledAt,
        approvedAt: farmer.approvedAt,
        createdAt: farmer.createdAt,
        nationalIdUrl: farmer.nationalIdUrl,
        businessCertUrl: farmer.businessCertUrl,
        farmPhotoUrls: farmer.farmPhotoUrls,
        productsOffered: farmer.productsOffered,
        huzaPurchaseAgreement: farmer.huzaPurchaseAgreement,
        stats: {
          productsSubmitted: farmer._count.products,
          productsApproved,
          productsPending,
          offers: farmer._count.offers,
          purchaseOrders: farmer._count.purchaseOrders,
          totalPaidRwf: totalPaid,
          paidCount: paidOrders.length,
          totalKgsBoughtByHuza: farmer.totalKgsBoughtByHuza ?? 0,
        },
        products: farmer.products,
        purchaseOrders: farmer.purchaseOrders,
        offers: farmer.offers,
        payments: paidOrders.map((p) => ({
          id: p.id,
          poNumber: p.poNumber,
          productName: p.productName,
          amount: p.totalAmount,
          paidAt: p.paidAt,
          paymentRef: p.paymentRef,
          paymentMethod: p.paymentMethod,
        })),
      },
    });
  }

  const statusMap: Record<string, string[]> = {
    pending: ["PENDING"],
    approved: ["APPROVED"],
    suspended: ["SUSPENDED", "REJECTED", "REMOVED"],
  };
  const statuses = statusMap[tab] || statusMap.pending;

  const farmers = await prisma.supplier.findMany({
    where: {
      status: { in: statuses as never },
      ...(q
        ? {
            OR: [
              { businessName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { district: { contains: q, mode: "insensitive" } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { fullName: true, phone: true, email: true } },
      products: {
        where: { deletedAt: null },
        select: { reviewStatus: true },
      },
      purchaseOrders: {
        where: { status: "PAID" },
        select: { totalAmount: true },
      },
      _count: { select: { products: true, purchaseOrders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    farmers: farmers.map((f) => {
      const productsApproved = f.products.filter((p) => p.reviewStatus === "APPROVED").length;
      const productsPending = f.products.filter((p) => p.reviewStatus === "PENDING").length;
      const totalPaid = f.purchaseOrders.reduce((s, p) => s + (p.totalAmount || 0), 0);
      return {
        id: f.id,
        businessName: f.businessName,
        phone: f.phone || f.user?.phone,
        email: f.email || f.user?.email,
        district: f.district,
        status: f.status,
        productsSubmitted: f._count.products,
        productsApproved,
        productsPending,
        purchaseOrders: f._count.purchaseOrders,
        totalPaidRwf: totalPaid,
        ratingAvg: f.ratingAvg,
        ratingCount: f.ratingCount,
        isVerified: f.isVerified,
        fullName: f.user?.fullName || f.businessName,
        farmingType: f.farmingType,
        createdAt: f.createdAt,
      };
    }),
  });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, reason, adminNotes, inspectionScheduledAt } = await req.json();

  if (action === "notify") {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const title = String(adminNotes?.title || "Message from Youth Huza");
    const body = String(adminNotes?.body || reason || "Please check your Huza farmer account.");
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title,
        body,
      },
    });
    await auditAdminAction(req, session, {
      action: "supplier.notify",
      entity: "Supplier",
      entityId: id,
      details: title,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "request_info") {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        adminNotes: adminNotes || reason || "Please provide additional documents",
      },
    });
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Additional information requested",
        body: adminNotes || reason || "Please update your verification documents.",
      },
    });
    await auditAdminAction(req, session, {
      action: "supplier.request_info",
      entity: "Supplier",
      entityId: id,
      details: adminNotes || reason,
    });
    return NextResponse.json(supplier);
  }

  if (action === "schedule_inspection") {
    const when = inspectionScheduledAt ? new Date(inspectionScheduledAt) : new Date();
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        inspectionScheduledAt: when,
        adminNotes: adminNotes || `Inspection scheduled for ${when.toISOString()}`,
      },
    });
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Farm inspection scheduled",
        body: `Youth Huza scheduled an inspection for ${when.toLocaleString()}.`,
      },
    });
    await auditAdminAction(req, session, {
      action: "supplier.schedule_inspection",
      entity: "Supplier",
      entityId: id,
      details: when.toISOString(),
    });
    return NextResponse.json(supplier);
  }

  if (action === "save_notes") {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { adminNotes: adminNotes ? String(adminNotes) : null },
    });
    return NextResponse.json(supplier);
  }

  const map: Record<string, SupplierStatus> = {
    approve: SupplierStatus.APPROVED,
    reject: SupplierStatus.REJECTED,
    suspend: SupplierStatus.SUSPENDED,
    remove: SupplierStatus.REMOVED,
    reactivate: SupplierStatus.APPROVED,
  };

  const status = map[action];
  if (!status) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      status,
      rejectionReason: action === "reject" ? reason || "Rejected" : null,
      approvedAt: action === "approve" || action === "reactivate" ? new Date() : undefined,
      availability: action === "approve" || action === "reactivate" ? "OPEN" : "CLOSED",
      isVerified: action === "approve" || action === "reactivate",
      verificationBadge:
        action === "approve" || action === "reactivate" ? "Youth Huza Verified" : null,
      adminNotes: typeof adminNotes === "string" ? adminNotes : undefined,
    },
  });

  await prisma.notification.create({
    data: {
      userId: supplier.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title: `Farmer ${action}`,
      body:
        action === "reject"
          ? `Your application was rejected: ${reason || "See admin notes"}`
          : `Your farmer account is now ${status}.`,
    },
  });

  await auditAdminAction(req, session, {
    action: `supplier.${action}`,
    entity: "Supplier",
    entityId: id,
    details: reason || `Status set to ${status}`,
  });

  return NextResponse.json(supplier);
}
