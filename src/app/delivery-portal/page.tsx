import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryPortalClient } from "./DeliveryPortalClient";
import { PortalCopyright } from "@/components/portals/PortalCopyright";

export const dynamic = "force-dynamic";

export default async function DeliveryPortalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (
    session.user.role !== "DELIVERY" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "MANAGER"
  ) {
    redirect("/account");
  }

  const where =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "MANAGER"
      ? {}
      : {
          OR: [
            { deliveryPersonId: session.user.id },
            {
              deliveryPersonId: null,
              status: { in: ["READY_FOR_DISPATCH" as const, "OUT_FOR_DELIVERY" as const] },
            },
          ],
        };

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          user: { select: { fullName: true, phone: true } },
          items: {
            include: { product: { select: { nameEn: true, unit: true } } },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--huza-green)]">
        Staff portal
      </p>
      <h1 className="section-title mt-1">Delivery</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Your assigned runs — update status and capture proof of delivery.
      </p>
      <DeliveryPortalClient deliveries={deliveries} />
      <PortalCopyright suffix="Delivery" />
    </div>
  );
}
