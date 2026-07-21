import { FarmerI18nHeader } from "@/components/portals/FarmerI18nHeader";
import { FarmerNotificationsEmpty } from "@/components/portals/FarmerNotificationsEmpty";
import { FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FarmerNotificationsPage() {
  const { session } = await requireFarmerWorkspace();

  const notes = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadIds = notes.filter((n) => !n.isRead).map((n) => n.id);
  if (unreadIds.length) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  return (
    <div>
      <FarmerI18nHeader titleKey="foNotifTitle" />

      {notes.length === 0 ? (
        <FarmerNotificationsEmpty />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <FarmerPanel className="!p-4">
                <p className="font-semibold text-[var(--huza-ink)]">{n.title}</p>
                <p className="mt-1 text-sm text-[var(--huza-muted)]">{n.body}</p>
                <p className="mt-2 text-[11px] text-[var(--huza-muted)]">
                  {n.createdAt.toLocaleString()}
                </p>
              </FarmerPanel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
