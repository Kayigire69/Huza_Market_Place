"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/components/ui/Toast";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  whatsappPresetUrl,
} from "@/lib/brand-contact";

export default function ContactPage() {
  const showToast = useToastStore((s) => s.show);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState(SUPPORT_PHONE_DISPLAY);
  const [email, setEmail] = useState(SUPPORT_EMAIL);
  const [address, setAddress] = useState("Kigali, Rwanda");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    void fetch("/api/public/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.phone === "string" && data.phone.trim()) setPhone(data.phone.trim());
        if (typeof data.email === "string" && data.email.trim()) setEmail(data.email.trim());
        if (typeof data.company_address === "string" && data.company_address.trim()) {
          setAddress(data.company_address.trim());
        }
        if (typeof data.whatsapp_url === "string") setWhatsappUrl(data.whatsapp_url.trim());
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  const waHref = whatsappPresetUrl("customer", whatsappUrl || undefined);
  const contactLine = phone || SUPPORT_PHONE_DISPLAY;

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
      <div className="mb-8 mt-8 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-sm">
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Phone / WhatsApp:</strong>{" "}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--huza-green)]"
            >
              {contactLine}
            </a>
          ) : (
            contactLine
          )}
        </p>
        <p>
          <strong>Address:</strong> {address}
        </p>
        <p>
          <strong>Hours:</strong> Daily 6:00 AM to 9:00 PM
        </p>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
          >
            Chat on WhatsApp
          </a>
        ) : null}
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
