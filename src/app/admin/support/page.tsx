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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--huza-green-dark)]">Support inbox</h1>
      <p className="mt-1 text-sm text-[var(--huza-muted)]">
        FAQs, complaints, and customer tickets from the Support Center.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--huza-green-dark)]">{msg}</p>}
      <div className="mt-6 space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold">{t.ticketNumber}</p>
              <span className="rounded-full bg-[var(--huza-mint)] px-2 py-0.5 text-xs">{t.status}</span>
            </div>
            <p className="mt-2 font-semibold">{t.subject}</p>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">{t.body}</p>
            <p className="mt-2 text-xs text-[var(--huza-muted)]">
              {t.type} · {t.user?.fullName || t.guestName || "Guest"} ·{" "}
              {t.user?.phone || t.guestPhone || "—"}
              {t.orderNumber ? ` · Order ${t.orderNumber}` : ""}
            </p>
            {t.adminReply && (
              <p className="mt-2 rounded-lg bg-[var(--huza-mint)] p-3 text-sm">
                Reply: {t.adminReply}
              </p>
            )}
            <textarea
              className="input-field mt-3 min-h-20"
              placeholder="Admin reply…"
              value={reply[t.id] ?? t.adminReply ?? ""}
              onChange={(e) => setReply((prev) => ({ ...prev, [t.id]: e.target.value }))}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  update(t.id, { adminReply: reply[t.id] ?? "", status: "IN_PROGRESS" })
                }
              >
                Save reply
              </Button>
              <Button size="sm" variant="secondary" onClick={() => update(t.id, { status: "RESOLVED" })}>
                Mark resolved
              </Button>
              <Button size="sm" variant="ghost" onClick={() => update(t.id, { status: "CLOSED" })}>
                Close
              </Button>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-sm text-[var(--huza-muted)]">No support tickets yet.</p>
        )}
      </div>
    </div>
  );
}
