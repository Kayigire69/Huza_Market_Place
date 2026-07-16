"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Inbox,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  TicketCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Channel = "tickets" | "chats" | "contacts";

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
  updatedAt: string;
  user?: { id: string; fullName: string; phone: string; email: string | null } | null;
};

type ChatMessage = {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
};

type ChatThread = {
  id: string;
  guestName: string | null;
  guestPhone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type ContactMessage = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type Counts = Record<string, number>;

const TICKET_TYPES = [
  ["ALL", "All types"],
  ["GENERAL", "General"],
  ["COMPLAINT", "Complaint"],
  ["RETURN", "Return"],
  ["REFUND", "Refund"],
  ["CALL_REQUEST", "Call request"],
] as const;

const CHANNELS: { id: Channel; label: string; icon: typeof LifeBuoy }[] = [
  { id: "tickets", label: "Tickets", icon: LifeBuoy },
  { id: "chats", label: "Live chat", icon: MessageCircle },
  { id: "contacts", label: "Contact messages", icon: Mail },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-RW", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function relativeAge(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function statusClass(status: string) {
  if (status === "RESOLVED" || status === "CLOSED" || status === "READ") {
    return "admin-status admin-status-ok";
  }
  if (status === "IN_PROGRESS") return "admin-status bg-blue-50 text-blue-700";
  return "admin-status admin-status-warn";
}

function customerName(ticket: Ticket) {
  return ticket.user?.fullName || ticket.guestName || "Guest customer";
}

function customerPhone(ticket: Ticket) {
  return ticket.user?.phone || ticket.guestPhone || null;
}

export function AdminSupportClient() {
  const [channel, setChannel] = useState<Channel>("tickets");
  const [status, setStatus] = useState("ACTIVE");
  const [type, setType] = useState("ALL");
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ channel, status });
      if (query.trim()) params.set("q", query.trim());
      if (channel === "tickets") params.set("type", type);
      const res = await fetch(`/api/admin/support?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load support inbox");

      setCounts(data.counts || {});
      if (channel === "tickets") {
        const rows = (data.tickets || []) as Ticket[];
        setTickets(rows);
        setSelectedId((current) =>
          current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null
        );
      } else if (channel === "chats") {
        const rows = (data.threads || []) as ChatThread[];
        setThreads(rows);
        setSelectedId((current) =>
          current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null
        );
      } else {
        const rows = (data.contacts || []) as ContactMessage[];
        setContacts(rows);
        setSelectedId((current) =>
          current && rows.some((row) => row.id === current) ? current : rows[0]?.id || null
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support inbox");
    } finally {
      setLoading(false);
    }
  }, [channel, query, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const selectedTicket = useMemo(
    () => tickets.find((item) => item.id === selectedId) || null,
    [selectedId, tickets]
  );
  const selectedThread = useMemo(
    () => threads.find((item) => item.id === selectedId) || null,
    [selectedId, threads]
  );
  const selectedContact = useMemo(
    () => contacts.find((item) => item.id === selectedId) || null,
    [contacts, selectedId]
  );

  const switchChannel = (next: Channel) => {
    setChannel(next);
    setSelectedId(null);
    setReply("");
    setNotice("");
    setError("");
    setType("ALL");
    setStatus(next === "tickets" ? "ACTIVE" : next === "chats" ? "OPEN" : "UNREAD");
  };

  const patch = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setNotice(success);
      setReply("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const filterOptions =
    channel === "tickets"
      ? [
          ["ACTIVE", "Active"],
          ["ALL", "All"],
          ["OPEN", "Open"],
          ["IN_PROGRESS", "In progress"],
          ["RESOLVED", "Resolved"],
          ["CLOSED", "Closed"],
        ]
      : channel === "chats"
        ? [
            ["OPEN", "Open"],
            ["ALL", "All"],
            ["CLOSED", "Closed"],
          ]
        : [
            ["UNREAD", "Unread"],
            ["ALL", "All"],
            ["READ", "Read"],
          ];

  const listCount =
    channel === "tickets" ? tickets.length : channel === "chats" ? threads.length : contacts.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="admin-panel-title">Support Inbox</h1>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {channel === "tickets" ? (
          <>
            <Metric label="Active" value={counts.active || 0} icon={Inbox} tone="orange" />
            <Metric label="Open" value={counts.open || 0} icon={CircleDot} />
            <Metric label="In progress" value={counts.inProgress || 0} icon={Clock3} tone="blue" />
            <Metric label="Resolved" value={counts.resolved || 0} icon={TicketCheck} tone="green" />
          </>
        ) : channel === "chats" ? (
          <>
            <Metric label="All chats" value={counts.all || 0} icon={MessageCircle} />
            <Metric label="Open" value={counts.open || 0} icon={CircleDot} tone="orange" />
            <Metric label="Closed" value={counts.closed || 0} icon={Check} tone="green" />
          </>
        ) : (
          <>
            <Metric label="All messages" value={counts.all || 0} icon={Mail} />
            <Metric label="Unread" value={counts.unread || 0} icon={Inbox} tone="orange" />
            <Metric label="Read" value={counts.read || 0} icon={Check} tone="green" />
          </>
        )}
      </div>

      <div className="admin-panel overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--admin-line)] p-2">
          {CHANNELS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchChannel(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  channel === item.id
                    ? "bg-[var(--huza-green)] text-white"
                    : "text-[var(--admin-muted)] hover:bg-[var(--admin-soft)] hover:text-[var(--admin-ink)]"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid min-h-[600px] xl:grid-cols-[minmax(340px,0.85fr)_minmax(460px,1.15fr)]">
          <section className="border-b border-[var(--admin-line)] xl:border-b-0 xl:border-r">
            <div className="space-y-3 border-b border-[var(--admin-line)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="admin-input w-full pl-9"
                  placeholder={
                    channel === "tickets"
                      ? "Search ticket, customer, order..."
                      : channel === "chats"
                        ? "Search chats..."
                        : "Search contact messages..."
                  }
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="admin-input min-w-0 flex-1"
                  aria-label="Filter by status"
                >
                  {filterOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {channel === "tickets" ? (
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="admin-input min-w-0 flex-1"
                    aria-label="Filter by ticket type"
                  >
                    {TICKET_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <p className="text-xs text-[var(--admin-muted)]">
                {loading ? "Updating inbox..." : `${listCount} conversation${listCount === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="max-h-[540px] overflow-y-auto">
              {loading && listCount === 0 ? (
                <ListSkeleton />
              ) : error && listCount === 0 ? (
                <EmptyState title="Could not load support" body={error} />
              ) : listCount === 0 ? (
                <EmptyState
                  title="Inbox clear"
                  body="No conversations match the selected filters."
                />
              ) : channel === "tickets" ? (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(ticket.id);
                      setReply(ticket.adminReply || "");
                      setNotice("");
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-[var(--admin-line)] p-4 text-left transition hover:bg-[var(--admin-soft)]",
                      selectedId === ticket.id && "bg-[var(--admin-soft)]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--huza-green-dark)]">
                          {ticket.ticketNumber}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                          {relativeAge(ticket.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold">{ticket.subject}</p>
                      <p className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                        {customerName(ticket)} · {ticket.type.replaceAll("_", " ")}
                      </p>
                      <span className={cn("mt-2", statusClass(ticket.status))}>{ticket.status}</span>
                    </div>
                    <ChevronRight className="mt-5 size-4 shrink-0 text-[var(--admin-muted)]" />
                  </button>
                ))
              ) : channel === "chats" ? (
                threads.map((thread) => {
                  const last = thread.messages.at(-1);
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(thread.id);
                        setReply("");
                        setNotice("");
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-[var(--admin-line)] p-4 text-left transition hover:bg-[var(--admin-soft)]",
                        selectedId === thread.id && "bg-[var(--admin-soft)]"
                      )}
                    >
                      <MessageCircle className="mt-0.5 size-5 shrink-0 text-[var(--huza-green)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">
                            {thread.guestName || "Guest customer"}
                          </p>
                          <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                            {relativeAge(thread.updatedAt)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                          {last?.body || "No messages"}
                        </p>
                        <span className={cn("mt-2", statusClass(thread.status))}>{thread.status}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(contact.id);
                      setNotice("");
                      if (!contact.isRead) {
                        void patch({ id: contact.id, isRead: true }, "Message marked as read");
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-[var(--admin-line)] p-4 text-left transition hover:bg-[var(--admin-soft)]",
                      selectedId === contact.id && "bg-[var(--admin-soft)]"
                    )}
                  >
                    <Mail
                      className={cn(
                        "mt-0.5 size-5 shrink-0",
                        contact.isRead ? "text-[var(--admin-muted)]" : "text-[var(--huza-green)]"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm", !contact.isRead && "font-bold")}>
                          {contact.fullName}
                        </p>
                        <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                          {relativeAge(contact.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{contact.subject}</p>
                      <p className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                        {contact.message}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="min-w-0 bg-white">
            {notice ? (
              <div className="m-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {notice}
              </div>
            ) : null}
            {error && listCount > 0 ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            {channel === "tickets" && selectedTicket ? (
              <TicketDetail
                ticket={selectedTicket}
                reply={reply}
                setReply={setReply}
                busy={busy}
                patch={patch}
              />
            ) : channel === "chats" && selectedThread ? (
              <ChatDetail
                thread={selectedThread}
                reply={reply}
                setReply={setReply}
                busy={busy}
                patch={patch}
              />
            ) : channel === "contacts" && selectedContact ? (
              <ContactDetail contact={selectedContact} busy={busy} patch={patch} />
            ) : (
              <EmptyState
                title="Select a conversation"
                body="Choose an item from the inbox to review its full details."
                tall
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
  tone?: "neutral" | "orange" | "blue" | "green";
}) {
  const tones = {
    neutral: "bg-[var(--admin-soft)] text-[var(--huza-green-dark)]",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="admin-kpi flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[var(--admin-ink)]">{value}</p>
      </div>
      <span className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
    </div>
  );
}

function TicketDetail({
  ticket,
  reply,
  setReply,
  busy,
  patch,
}: {
  ticket: Ticket;
  reply: string;
  setReply: (value: string) => void;
  busy: boolean;
  patch: (body: Record<string, unknown>, success: string) => Promise<void>;
}) {
  const phone = customerPhone(ticket);
  const email = ticket.user?.email;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--admin-line)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold text-[var(--huza-green)]">
              {ticket.ticketNumber}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--admin-ink)]">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              Opened {formatDate(ticket.createdAt)} · Updated {relativeAge(ticket.updatedAt)}
            </p>
          </div>
          <span className={statusClass(ticket.status)}>{ticket.status}</span>
        </div>
      </div>

      <div className="flex-1 space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info icon={UserRound} label="Customer" value={customerName(ticket)} />
          <Info icon={Phone} label="Phone" value={phone || "Not provided"} href={phone ? `tel:${phone}` : undefined} />
          <Info icon={Mail} label="Email" value={email || "Not provided"} href={email ? `mailto:${email}` : undefined} />
          <Info
            icon={LifeBuoy}
            label="Request"
            value={ticket.type.replaceAll("_", " ")}
          />
        </div>

        {ticket.orderNumber ? (
          <div className="rounded-xl border border-[var(--admin-line)] bg-[var(--admin-soft)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              Related order
            </p>
            <p className="mt-1 font-mono text-sm font-semibold">{ticket.orderNumber}</p>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
            Customer message
          </p>
          <div className="rounded-2xl rounded-tl-sm bg-[var(--admin-soft)] p-4 text-sm leading-6">
            {ticket.body}
          </div>
        </div>

        {ticket.adminReply ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              Latest admin reply
            </p>
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-[var(--huza-green)] p-4 text-sm leading-6 text-white">
              {ticket.adminReply}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-[var(--admin-line)] bg-[var(--admin-soft)] p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          Reply
        </label>
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className="admin-input min-h-24 w-full resize-y bg-white"
          placeholder="Write a clear response for the customer..."
          maxLength={4000}
        />
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {ticket.status === "OPEN" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void patch({ id: ticket.id, status: "IN_PROGRESS" }, "Ticket moved to in progress")}
              >
                <Clock3 className="size-4" />
                Start work
              </Button>
            ) : null}
            {ticket.status === "CLOSED" || ticket.status === "RESOLVED" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void patch({ id: ticket.id, status: "OPEN" }, "Ticket reopened")}
              >
                Reopen
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void patch({ id: ticket.id, status: "CLOSED" }, "Ticket closed")}
              >
                Close
              </Button>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy || !reply.trim()}
            onClick={() =>
              void patch(
                { id: ticket.id, adminReply: reply.trim(), status: "RESOLVED" },
                "Reply saved and ticket resolved"
              )
            }
          >
            <Send className="size-4" />
            Save reply and resolve
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatDetail({
  thread,
  reply,
  setReply,
  busy,
  patch,
}: {
  thread: ChatThread;
  reply: string;
  setReply: (value: string) => void;
  busy: boolean;
  patch: (body: Record<string, unknown>, success: string) => Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-line)] p-5">
        <div>
          <h2 className="text-lg font-bold">{thread.guestName || "Guest customer"}</h2>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {thread.guestPhone || "No phone"} · Started {formatDate(thread.createdAt)}
          </p>
        </div>
        <span className={statusClass(thread.status)}>{thread.status}</span>
      </div>
      <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-5">
        {thread.messages.map((message) => {
          const agent = message.sender === "AGENT";
          return (
            <div key={message.id} className={cn("flex", agent ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl p-3 text-sm",
                  agent
                    ? "rounded-tr-sm bg-[var(--huza-green)] text-white"
                    : "rounded-tl-sm bg-[var(--admin-soft)]"
                )}
              >
                <p>{message.body}</p>
                <p className={cn("mt-1 text-[10px]", agent ? "text-white/70" : "text-[var(--admin-muted)]")}>
                  {message.sender} · {formatDate(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3 border-t border-[var(--admin-line)] bg-[var(--admin-soft)] p-4">
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className="admin-input min-h-20 w-full resize-y bg-white"
          placeholder="Write a reply..."
          maxLength={4000}
          disabled={thread.status === "CLOSED"}
        />
        <div className="flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void patch(
                { id: thread.id, status: thread.status === "OPEN" ? "CLOSED" : "OPEN" },
                thread.status === "OPEN" ? "Chat closed" : "Chat reopened"
              )
            }
          >
            {thread.status === "OPEN" ? "Close chat" : "Reopen chat"}
          </Button>
          {thread.status === "OPEN" ? (
            <Button
              type="button"
              size="sm"
              disabled={busy || !reply.trim()}
              onClick={() => void patch({ id: thread.id, reply: reply.trim() }, "Reply sent")}
            >
              <Send className="size-4" />
              Send reply
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContactDetail({
  contact,
  busy,
  patch,
}: {
  contact: ContactMessage;
  busy: boolean;
  patch: (body: Record<string, unknown>, success: string) => Promise<void>;
}) {
  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--admin-muted)]">{formatDate(contact.createdAt)}</p>
          <h2 className="mt-1 text-xl font-bold">{contact.subject}</h2>
        </div>
        <span className={statusClass(contact.isRead ? "READ" : "UNREAD")}>
          {contact.isRead ? "READ" : "UNREAD"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info icon={UserRound} label="From" value={contact.fullName} />
        <Info
          icon={Mail}
          label="Email"
          value={contact.email || "Not provided"}
          href={contact.email ? `mailto:${contact.email}` : undefined}
        />
        <Info
          icon={Phone}
          label="Phone"
          value={contact.phone || "Not provided"}
          href={contact.phone ? `tel:${contact.phone}` : undefined}
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          Message
        </p>
        <div className="rounded-2xl bg-[var(--admin-soft)] p-4 text-sm leading-6">
          {contact.message}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-4">
        {contact.email ? (
          <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Re: ${contact.subject}`)}`}>
            <Button type="button" size="sm">
              <Mail className="size-4" />
              Reply by email
            </Button>
          </a>
        ) : null}
        {contact.phone ? (
          <a href={`tel:${contact.phone}`}>
            <Button type="button" size="sm" variant="ghost">
              <Phone className="size-4" />
              Call customer
            </Button>
          </a>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() =>
            void patch(
              { id: contact.id, isRead: !contact.isRead },
              contact.isRead ? "Message marked as unread" : "Message marked as read"
            )
          }
        >
          {contact.isRead ? "Mark unread" : "Mark read"}
        </Button>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-[var(--huza-green)]" />
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          {label}
        </span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[var(--admin-line)] p-3 hover:bg-[var(--admin-soft)]"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--admin-line)] p-3">
      {content}
    </div>
  );
}

function EmptyState({ title, body, tall = false }: { title: string; body: string; tall?: boolean }) {
  return (
    <div className={cn("grid place-items-center p-8 text-center", tall && "min-h-[540px]")}>
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--admin-soft)] text-[var(--huza-green)]">
          <Inbox className="size-6" />
        </span>
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-[var(--admin-muted)]">{body}</p>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-1 p-3" aria-label="Loading support inbox">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-xl p-3">
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--admin-soft)]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--admin-soft)]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--admin-soft)]" />
        </div>
      ))}
    </div>
  );
}
