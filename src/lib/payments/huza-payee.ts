/**
 * Interim Huza pay-in contact while MTN/Airtel collection APIs are not live.
 * Used for MoMo send-to-pay and customer WhatsApp / delivery questions.
 */
export const HUZA_PAYEE_PHONE = "0788241665";
export const HUZA_PAYEE_NAME = "Ines Umurerwa";
export const HUZA_PAYEE_WHATSAPP_URL = "https://wa.me/250788241665";

/** How long unpaid manual MoMo orders keep stock reserved */
export const MANUAL_PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;
export const LIVE_PAYMENT_TIMEOUT_MS = 3 * 60 * 1000;

export function formatHuzaPayeeDisplay(phone = HUZA_PAYEE_PHONE): string {
  const digits = phone.replace(/\D/g, "");
  const local =
    digits.startsWith("250") && digits.length === 12
      ? `0${digits.slice(3)}`
      : digits.startsWith("0")
        ? digits
        : phone;
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return local;
}
