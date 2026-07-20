"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/components/ui/Toast";

export default function ContactPage() {
  const showToast = useToastStore((s) => s.show);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    void fetch("/api/public/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.phone === "string") setPhone(data.phone.trim());
        if (typeof data.whatsapp_url === "string") setWhatsappUrl(data.whatsapp_url.trim());
      })
      .catch(() => {
        /* keep empty — same placeholder as before */
      });
  }, []);

  const waDigits = whatsappUrl.replace(/.*wa\.me\//, "").replace(/\D/g, "");
  const contactLine = phone || (waDigits ? `+${waDigits}` : "");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk(false);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error || "Failed to send message. Please try again.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setOk(true);
    showToast("Message sent. We will reply soon.", "success");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="section-title">Contact Us</h1>
      <p className="mb-8 mt-2 text-[var(--huza-muted)]">
        Reach Youth Huza — the team behind HUZA FRESH.
      </p>
      <div className="mb-8 space-y-2 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-sm">
        <p>
          <strong>Email:</strong> info@youthhuza.rw
        </p>
        <p>
          <strong>Phone / WhatsApp:</strong>{" "}
          {contactLine ? (
            whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--huza-green)]"
              >
                {contactLine}
              </a>
            ) : (
              contactLine
            )
          ) : (
            "Add your business number in Admin → Settings when ready"
          )}
        </p>
        <p>
          <strong>Address:</strong> Kigali, Rwanda
        </p>
        <p>
          <strong>Hours:</strong> Daily 6:00 AM – 9:00 PM
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-6"
        noValidate
      >
        <div>
          <label className="label" htmlFor="contact-fullName">
            Full name
          </label>
          <input
            id="contact-fullName"
            name="fullName"
            className="input-field mt-1"
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">
            Email <span className="font-normal text-[var(--huza-muted)]">(optional)</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className="input-field mt-1"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-phone">
            Phone
          </label>
          <input
            id="contact-phone"
            name="phone"
            className="input-field mt-1"
            placeholder="078xxxxxxx"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-subject">
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            className="input-field mt-1"
            placeholder="How can we help?"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            className="input-field mt-1 min-h-28"
            placeholder="Write your message"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm text-[var(--huza-green-dark)]" role="status">
            Message sent. We will reply soon.
          </p>
        ) : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
