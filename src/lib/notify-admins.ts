import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/** Push an in-app alert to every active admin (dashboard live feed). */
export async function notifyAdmins(input: {
  type: NotificationType;
  title: string;
  body: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: input.type,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
    })),
  });
}
