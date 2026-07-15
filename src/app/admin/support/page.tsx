"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Ticket = {
  id: string;
  ticketNumber: string;
  type: string;
  status: string;
  subject: string;
  body: string;
  guestName: string | null;
  guestPhone: string | null;
  orderNumber: string | null;
  adminReply: string | null;
  createdAt: string;
  user?: { fullName: string; phone: string; email: string | null } | null;
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch("/api/admin/support");
    if (!res.ok) {
      setMsg("Failed to load tickets");
      return;
    }
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (id: string, patch: { status?: string; adminReply?: string }) => {
    setMsg("");
    const res = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Update failed");
      return;
    }
    setMsg("Ticket updated");
    await load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Support</h1>
        <p className="admin-panel-sub">
          FAQs, complaints, and customer tickets from the Support Center.
        </p>
      </div>
      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">No tickets yet.</div>
        ) : (
          tickets.map((t) => (
            <article key={t.id} className="admin-panel space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold">{t.ticketNumber}</p>
                <span className="admin-status admin-status-warn">{t.status}</span>
              </div>
              <p className="font-semibold">{t.subject}</p>
              <p className="text-sm text-[var(--admin-muted)]">{t.body}</p>
              <p className="text-xs text-[var(--admin-muted)]">
                {t.type} · {t.user?.fullName || t.guestName || "Guest"} ·{" "}
                {t.user?.phone || t.guestPhone || "—"}
                {t.orderNumber ? ` · Order ${t.orderNumber}` : ""}
              </p>
              {t.adminReply ? (
                <p className="rounded-lg bg-[var(--admin-soft)] p-3 text-sm">Reply: {t.adminReply}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <input
                  className="admin-input flex-1"
                  placeholder="Reply to customer…"
                  value={reply[t.id] || ""}
                  onChange={(e) => setReply((r) => ({ ...r, [t.id]: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void update(t.id, {
                      adminReply: reply[t.id],
                      status: "RESOLVED",
                    })
                  }
                >
                  Send &amp; resolve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void update(t.id, { status: "IN_PROGRESS" })}
                >
                  In progress
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
