import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";

export async function PATCH(req: Request) {
  const session = await requireAdminSession({ modules: ["products", "customers"] });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action, adminReply } = await req.json();
  const before = await prisma.review.findUnique({ where: { id } });
  if (!before && action !== "delete") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "delete") {
    if (before) {
      await prisma.review.delete({ where: { id } });
      await auditAdminAction(req, session, {
        action: "review.delete",
        entity: "Review",
        entityId: id,
        details: `Deleted review rating=${before.rating}`,
        before: {
          rating: before.rating,
          comment: before.comment,
          isHidden: before.isHidden,
        },
        after: null,
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "reply") {
    const review = await prisma.review.update({
      where: { id },
      data: {
        adminReply: adminReply || "",
        repliedById: session.user.id,
        repliedAt: new Date(),
      },
    });
    await auditAdminAction(req, session, {
      action: "review.reply",
      entity: "Review",
      entityId: id,
      details: "Admin replied to review",
      before: { adminReply: before?.adminReply || null },
      after: { adminReply: review.adminReply },
    });
    return NextResponse.json(review);
  }

  const review = await prisma.review.update({
    where: { id },
    data: action === "hide" ? { isHidden: true } : { isReported: true },
  });
  await auditAdminAction(req, session, {
    action: action === "hide" ? "review.hide" : "review.report",
    entity: "Review",
    entityId: id,
    details: `Review ${action}`,
    before: { isHidden: before?.isHidden, isReported: before?.isReported },
    after: { isHidden: review.isHidden, isReported: review.isReported },
  });
  return NextResponse.json(review);
}
