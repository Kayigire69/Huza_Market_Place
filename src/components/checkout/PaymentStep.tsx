"use client";

import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatMomoDisplay, isValidRwandaMomoPhone } from "@/lib/phone";
import { formatRwf } from "@/lib/utils";

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
  onMethodChange,
  onPaymentPhoneChange,
  onFullNameChange,
  onContactPhoneChange,
  onPayNow,
}: Props) {
  const phoneOk = isValidRwandaMomoPhone(paymentPhone);
  const canPay =
    !loading &&
    fullName.trim().length > 1 &&
    contactPhone.trim().length > 0 &&
    phoneOk;

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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Full name</span>
          <input
            required
            value={fullName}
            disabled={loading}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-base disabled:opacity-60"
            autoComplete="name"
          />
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
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Mobile Number</span>
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
            Prompt will be sent to {formatMomoDisplay(paymentPhone)}
          </p>
        ) : paymentPhone ? (
          <p className="mt-1.5 text-xs text-red-600">Enter a valid MTN or Airtel number</p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--huza-muted)]">
            Prefills from your account when available. Approve the prompt on this phone.
          </p>
        )}
      </label>

      {/* In-form Pay Now (desktop). Mobile uses the sticky bar only. */}
      <div className="hidden lg:block">
        <Button type="button" size="lg" className="w-full" disabled={!canPay} onClick={onPayNow}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sending payment request…
            </>
          ) : (
            <>Pay Now · {formatRwf(total)}</>
          )}
        </Button>
      </div>

      <p className="flex items-start justify-center gap-1.5 text-center text-[11px] leading-snug text-[var(--huza-muted)]">
        <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
        Secure payments powered by MTN Mobile Money and Airtel Money.
      </p>
    </div>
  );
}
