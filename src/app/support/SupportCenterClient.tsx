"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { whatsappPresetUrl } from "@/lib/brand-contact";

const TICKET_TYPES = [
  { value: "GENERAL", label: "General question" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "RETURN", label: "Return" },
  { value: "REFUND", label: "Refund" },
  { value: "CALL_REQUEST", label: "Request a call" },
] as const;

export function SupportCenterClient({
  userName,
  userPhone,
}: {
  userName?: string | null;
  userPhone?: string | null;
}) {
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const waHref = whatsappPresetUrl("orderSupport");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"),
        subject: form.get("subject"),
        body: form.get("body"),
        orderNumber: form.get("orderNumber") || null,
        guestName: form.get("guestName") || null,
        guestPhone: form.get("guestPhone") || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not submit ticket");
      return;
    }
    setOk(`Ticket ${data.ticketNumber} submitted. We will follow up soon.`);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/faq"
          className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 hover:border-[var(--huza-green)] transition"
        >
          <p className="font-semibold text-[var(--huza-green-dark)]">FAQ</p>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            Delivery zones, payments, returns, and more.
          </p>
        </Link>
        <a
          href="mailto:info@youthhuza.rw"
          className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 hover:border-[var(--huza-green)] transition"
        >
          <p className="font-semibold text-[var(--huza-green-dark)]">Email</p>
          <p className="text-sm text-[var(--huza-muted)] mt-1">
            Write to Youth Huza at info@youthhuza.rw.
          </p>
        </a>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 hover:border-[var(--huza-green)] transition sm:col-span-2"
          >
            <p className="font-semibold text-[var(--huza-green-dark)]">WhatsApp</p>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              Chat with Youth Huza for order help — +250 788 241 665
            </p>
          </a>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Open a support ticket</h2>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="label">Type</label>
            <select name="type" className="input-field" defaultValue="GENERAL" required>
              {TICKET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {!userName && (
            <>
              <div>
                <label className="label">Your name</label>
                <input name="guestName" className="input-field" required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="guestPhone" className="input-field" required />
              </div>
            </>
          )}
          {userName && (
            <p className="text-sm text-[var(--huza-muted)]">
              Signed in as {userName}
              {userPhone ? ` · ${userPhone}` : ""}
            </p>
          )}
          <div>
            <label className="label">Subject</label>
            <input name="subject" className="input-field" required />
          </div>
          <div>
            <label className="label">Order number (optional)</label>
            <input name="orderNumber" className="input-field" placeholder="HUZA-…" />
          </div>
          <div>
            <label className="label">Details</label>
            <textarea name="body" className="input-field min-h-28" required />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {ok && <p className="text-sm text-[var(--huza-green-dark)]">{ok}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit ticket"}
          </Button>
        </form>
      </section>

      <p className="text-sm text-[var(--huza-muted)] text-center">
        Track an order at{" "}
        <Link href="/track" className="text-[var(--huza-green)] font-semibold">
          /track
        </Link>{" "}
        · Or use the chat button for a quick message.
      </p>
    </div>
  );
}
