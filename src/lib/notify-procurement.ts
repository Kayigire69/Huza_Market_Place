import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/** Notify procurement / ops staff of an assigned PO or farmer acceptance. */
export async function notifyProcurementStaff(input: {
  title: string;
  body: string;
  type?: NotificationType;
}) {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["PROCUREMENT", "ADMIN", "SUPER_ADMIN", "MANAGER"] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
    take: 40,
  });
  if (staff.length === 0) return;
  await prisma.notification.createMany({
    data: staff.map((u) => ({
      userId: u.id,
      type: input.type || "PO_RECEIVED",
      channel: "IN_APP",
      title: input.title,
      body: input.body.slice(0, 280),
    })),
  });
}
