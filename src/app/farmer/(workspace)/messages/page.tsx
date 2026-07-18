import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FarmerMessagesPage() {
  const { session } = await requireFarmerWorkspace();

  const messages = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      type: { in: ["SUPPLIER_STATUS", "PAYMENT_PROCESSED", "PO_RECEIVED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div>
      <FarmerPageHeader
        title="Messages"
        subtitle="Approvals, payments, visit updates, and training notes from Youth Huza."
      />

      {messages.length === 0 ? (
        <FarmerPanel className="max-w-2xl">
          <p className="text-sm text-[var(--huza-muted)]">
            No messages yet. When Huza reviews produce, schedules a visit, or pays you, it appears
            here.
          </p>
        </FarmerPanel>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <FarmerPanel
              key={m.id}
              className={m.isRead ? "" : "border-[var(--huza-green)]/40 bg-[var(--huza-mint)]/20"}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-[var(--huza-ink)]">{m.title}</h3>
                <time className="text-xs text-[var(--huza-muted)]">
                  {new Date(m.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--huza-muted)]">{m.body}</p>
            </FarmerPanel>
          ))}
        </div>
      )}
    </div>
  );
}
