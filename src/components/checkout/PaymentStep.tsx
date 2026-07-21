"use client";

import { useState } from "react";
import { Copy, Check, Loader2, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatMomoDisplay, isValidRwandaMomoPhone } from "@/lib/phone";
import { formatRwf } from "@/lib/utils";
import { formatHuzaPayeeDisplay } from "@/lib/payments/huza-payee";

export type PaymentMethodId = "MTN_MOMO" | "AIRTEL_MONEY";

const METHODS: { id: PaymentMethodId; label: string; hint: string }[] = [
  { id: "MTN_MOMO", label: "MTN Mobile Money", hint: "078 · 079" },
  { id: "AIRTEL_MONEY", label: "Airtel Money", hint: "072 · 073" },
];

type Props = {
  method: PaymentMethodId;
  paymentPhone: string;
  fullName: string;
  contactPhone: string;
  total: number;
  loading: boolean;
  /** When true, customer sends MoMo to Huza (no live API prompt) */
  manualPayIn: boolean;
  payeeName: string;
  payeePhone: string;
  whatsappUrl?: string;
  onMethodChange: (method: PaymentMethodId) => void;
  onPaymentPhoneChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onPayNow: () => void;
};

export function PaymentStep({
  method,
  paymentPhone,
  fullName,
  contactPhone,
  total,
  loading,
  manualPayIn,
  payeeName,
  payeePhone,
  whatsappUrl,
  onMethodChange,
  onPaymentPhoneChange,
  onFullNameChange,
  onContactPhoneChange,
  onPayNow,
}: Props) {
  const [copied, setCopied] = useState(false);
  const phoneOk = isValidRwandaMomoPhone(paymentPhone);
  const canPay =
    !loading &&
    fullName.trim().length > 1 &&
    contactPhone.trim().length > 0 &&
    phoneOk;

  const copyPayee = async () => {
    try {
      await navigator.clipboard.writeText(payeePhone.replace(/\s/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--huza-ink)]">Payment Method</p>
        <div className="space-y-2" role="radiogroup" aria-label="Payment method">
          {METHODS.map((m) => {
            const selected = method === m.id;
            return (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                  selected
                    ? "border-[var(--huza-green)] bg-[var(--huza-mint)]"
                    : "border-[var(--huza-line)] bg-white hover:border-[var(--huza-green)]/50"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={selected}
                  disabled={loading}
                  onChange={() => onMethodChange(m.id)}
                  className="size-4 accent-[var(--huza-green-dark)]"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[var(--huza-ink)]">
                    {m.label}
                  </span>
                  <span className="text-xs text-[var(--huza-muted)]">{m.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {manualPayIn ? (
        <div className="rounded-xl border border-[var(--huza-green)]/40 bg-[var(--huza-mint)] p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-green-dark)]">
            Send payment to Youth Huza
          </p>
          <p className="mt-1 font-semibold text-[var(--huza-ink)]">
            {payeeName} · {formatHuzaPayeeDisplay(payeePhone)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--huza-muted)]">
            After you place the order, send exactly <strong>{formatRwf(total)}</strong> via MoMo to
            this number. Use your order number as the payment message. We confirm when money arrives.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void copyPayee()}>
              {copied ? (
                <>
                  <Check className="size-3.5" aria-hidden /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden /> Copy number
                </>
              )}
            </Button>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--huza-line)] bg-white px-3 text-xs font-semibold text-[var(--huza-green-dark)]"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-[var(--huza-muted)] leading-relaxed">
        Enter the <strong className="font-semibold text-[var(--huza-ink)]">payer</strong> details
        (the client who sends MoMo), so we can match the payment.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Payer full name</span>
          <input
            required
            value={fullName}
            disabled={loading}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base disabled:opacity-60"
            autoComplete="name"
            placeholder="Name on the MoMo account"
          />
          <p className="mt-1.5 text-xs text-[var(--huza-muted)]">
            Name of the client / payer sending the payment
          </p>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Contact phone</span>
          <input
            required
            value={contactPhone}
            disabled={loading}
            onChange={(e) => onContactPhoneChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base disabled:opacity-60"
            autoComplete="tel"
            inputMode="tel"
            placeholder="07X XXX XXXX"
          />
          <p className="mt-1.5 text-xs text-[var(--huza-muted)]">
            For delivery updates (can match MoMo)
          </p>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">
          {manualPayIn ? "MoMo number that will pay" : "Mobile Number"}
        </span>
        <div className="flex overflow-hidden rounded-xl border border-[var(--huza-line)] bg-white focus-within:border-[var(--huza-green)]">
          <span className="flex items-center border-r border-[var(--huza-line)] bg-[var(--huza-cream,#F7FBF8)] px-3 text-sm font-medium text-[var(--huza-muted)]">
            +250
          </span>
          <input
            required
            value={paymentPhone.replace(/^\+?250/, "").replace(/^0/, "")}
            disabled={loading}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
              onPaymentPhoneChange(digits ? `0${digits}` : "");
            }}
            className="min-w-0 flex-1 px-4 py-3 text-base outline-none disabled:opacity-60"
            inputMode="tel"
            autoComplete="tel"
            placeholder="78X XXX XXX"
            aria-invalid={paymentPhone.length > 0 && !phoneOk}
          />
        </div>
        {paymentPhone && phoneOk ? (
          <p className="mt-1.5 text-xs text-[var(--huza-muted)]">
            {manualPayIn
              ? `We match payment from ${formatMomoDisplay(paymentPhone)}`
              : `Prompt will be sent to ${formatMomoDisplay(paymentPhone)}`}
          </p>
        ) : paymentPhone ? (
          <p className="mt-1.5 text-xs text-red-600">Enter a valid MTN or Airtel number</p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--huza-muted)]">
            {manualPayIn
              ? "Enter the payer’s MoMo number (the phone that sends money to Youth Huza)."
              : "Prefills from your account when available. Approve the prompt on this phone."}
          </p>
        )}
      </label>

      <div className="hidden lg:block">
        <Button type="button" size="lg" className="w-full" disabled={!canPay} onClick={onPayNow}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />{" "}
              {manualPayIn ? "Placing order…" : "Sending payment request…"}
            </>
          ) : (
            <>{manualPayIn ? "Place order · Pay by MoMo" : "Pay Now"} · {formatRwf(total)}</>
          )}
        </Button>
      </div>

      <p className="flex items-start justify-center gap-1.5 text-center text-[11px] leading-snug text-[var(--huza-muted)]">
        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
        {manualPayIn
          ? "Pay by MTN MoMo or Airtel Money to Youth Huza. Admin confirms when payment is received."
          : "Secure payments powered by MTN Mobile Money and Airtel Money."}
      </p>
    </div>
  );
}
