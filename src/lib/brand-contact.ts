/**
 * Public contact defaults for HUZA FRESH / Youth Huza.
 * Override via env or Admin → Settings (whatsapp_url, phone, email).
 * WhatsApp / phone stay empty until you add the real business number.
 */

export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL?.trim() || "info@youthhuza.rw";

/** Display phone, e.g. +250 7XX XXX XXX. Leave blank until set */
export const SUPPORT_PHONE_DISPLAY = process.env.SUPPORT_PHONE_DISPLAY?.trim() || "";

/** Full wa.me URL. Leave blank until WhatsApp Business is ready */
export const DEFAULT_WHATSAPP_URL = process.env.WHATSAPP_URL?.trim() || "";

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
