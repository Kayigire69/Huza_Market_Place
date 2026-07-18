import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
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

  // Mark visible notifications as read
  const unreadIds = notes.filter((n) => !n.isRead).map((n) => n.id);
  if (unreadIds.length) {
    await prisma.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  return (
    <div>
      <FarmerPageHeader
        title="Notifications"
        subtitle="Real-time updates: approvals, payments, visits, and training."
      />

      {notes.length === 0 ? (
        <FarmerPanel className="max-w-2xl">
          <p className="text-sm text-[var(--huza-muted)]">
            You are all caught up. New updates from Youth Huza will show here.
          </p>
        </FarmerPanel>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <FarmerPanel className="!p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--huza-ink)]">{n.title}</p>
                  <time className="text-xs text-[var(--huza-muted)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm text-[var(--huza-muted)] line-clamp-3">{n.body}</p>
              </FarmerPanel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
