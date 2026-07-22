/**
 * Public contact defaults for HUZA FRESH / Youth Huza.
 * Override via env or Admin → Settings (whatsapp_url, phone, email).
 * WhatsApp uses Click-to-Chat only (no Business API).
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

/** Official Youth Huza WhatsApp (international, no +) */
export const HUZA_WHATSAPP_DIGITS = "250788241665";

export const WHATSAPP_PRESET = {
  customer: "Hello Youth Huza, I would like to know more about your products.",
  farmer: "Hello Youth Huza, I would like to become a partner farmer.",
  orderSupport: "Hello Youth Huza, I need assistance with my order.",
} as const;

export type WhatsAppPreset = keyof typeof WHATSAPP_PRESET;

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

/** Normalize any wa.me / phone string to international digits (250…). */
export function whatsappDigitsFromUrl(url?: string | null): string {
  const digits = (url || "").replace(/\D/g, "");
  if (!digits) return HUZA_WHATSAPP_DIGITS;
  if (digits.startsWith("250") && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9) return `250${digits}`;
  return digits.length >= 10 ? digits : HUZA_WHATSAPP_DIGITS;
}

export function resolveWhatsAppUrl(url?: string | null): string {
  const candidate = url?.trim() || DEFAULT_WHATSAPP_URL;
  if (!isWhatsAppConfigured(candidate)) {
    return isWhatsAppConfigured(DEFAULT_WHATSAPP_URL) ? DEFAULT_WHATSAPP_URL : "";
  }
  const digits = whatsappDigitsFromUrl(candidate);
  return `https://wa.me/${digits}`;
}

/**
 * Click-to-Chat URL. Optional pre-filled message is URL-encoded.
 * Uses Admin/settings URL when provided, otherwise the official Huza number.
 */
export function buildWhatsAppUrl(
  baseUrl?: string | null,
  text?: string | null
): string {
  const base = resolveWhatsAppUrl(baseUrl);
  if (!base) return "";
  const message = text?.trim();
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function whatsappPresetUrl(
  preset: WhatsAppPreset,
  baseUrl?: string | null
): string {
  return buildWhatsAppUrl(baseUrl, WHATSAPP_PRESET[preset]);
}

export function supportPhoneOrEmailLine(): string {
  if (SUPPORT_PHONE_DISPLAY) {
    return `${SUPPORT_PHONE_DISPLAY} · ${SUPPORT_EMAIL}`;
  }
  return SUPPORT_EMAIL;
}
