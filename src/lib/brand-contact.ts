/**
 * Public contact defaults for HUZA FRESH / Youth Huza.
 * Override via env or Admin → Settings (whatsapp_url, phone, email).
 */

import {
  HUZA_PAYEE_PHONE,
  HUZA_PAYEE_WHATSAPP_URL,
  formatHuzaPayeeDisplay,
} from "@/lib/payments/huza-payee";

export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL?.trim() || "info@youthhuza.rw";

/** Display phone — payment + delivery questions (same MoMo / WhatsApp line) */
export const SUPPORT_PHONE_DISPLAY =
  process.env.SUPPORT_PHONE_DISPLAY?.trim() || formatHuzaPayeeDisplay(HUZA_PAYEE_PHONE);

/** Full wa.me URL for the same Huza contact number */
export const DEFAULT_WHATSAPP_URL =
  process.env.WHATSAPP_URL?.trim() || HUZA_PAYEE_WHATSAPP_URL;

const PLACEHOLDER_WHATSAPP_DIGITS = new Set([
  "250788000000",
  "0788000000",
  "788000000",
]);

export function isWhatsAppConfigured(url?: string | null): boolean {
  if (!url?.trim()) return false;
  const digits = url.replace(/\D/g, "");
  if (!digits || PLACEHOLDER_WHATSAPP_DIGITS.has(digits)) return false;
  return digits.length >= 10;
}

export function resolveWhatsAppUrl(url?: string | null): string {
  const candidate = url?.trim() || DEFAULT_WHATSAPP_URL;
  return isWhatsAppConfigured(candidate) ? candidate : "";
}

export function supportPhoneOrEmailLine(): string {
  if (SUPPORT_PHONE_DISPLAY) {
    return `${SUPPORT_PHONE_DISPLAY} · ${SUPPORT_EMAIL}`;
  }
  return SUPPORT_EMAIL;
}
