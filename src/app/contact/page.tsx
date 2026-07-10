"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to send");
      return;
    }
    setOk(true);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="section-title">Contact Us</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Reach Youth Huza — the team behind HUZA MARKETPLACE.
      </p>
      <div className="mb-8 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-sm space-y-2">
        <p>
          <strong>Phone:</strong> +250 788 000 000
        </p>
        <p>
          <strong>Email:</strong> hello@youthhuza.rw
        </p>
        <p>
          <strong>Address:</strong> Kigali, Rwanda
        </p>
        <p>
          <strong>Hours:</strong> Daily 6:00 AM – 9:00 PM
        </p>
      </div>
      <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--huza-line)] bg-white p-6 space-y-3">
        <input name="fullName" className="input-field" placeholder="Full name" required />
        <input name="email" type="email" className="input-field" placeholder="Email (optional)" />
        <input name="phone" className="input-field" placeholder="Phone" />
        <input name="subject" className="input-field" placeholder="Subject" required />
        <textarea name="message" className="input-field min-h-28" placeholder="Message" required />
        {error && <p className="text-sm text-red-700">{error}</p>}
        {ok && <p className="text-sm text-[var(--huza-green-dark)]">Message sent. We will reply soon.</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
