/** Normalize Rwandan MSISDN to 2507XXXXXXXX (client + server safe). */
export function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `250${digits}`;
  return digits;
}

/** MTN (078/079) and Airtel (072/073) mobile money lines. */
export function isValidRwandaMomoPhone(phone: string): boolean {
  const msisdn = normalizeMsisdn(phone);
  return /^2507[2389]\d{7}$/.test(msisdn);
}

/** Display as +250 78X XXX XXX */
export function formatMomoDisplay(phone: string): string {
  const msisdn = normalizeMsisdn(phone);
  if (msisdn.length !== 12 || !msisdn.startsWith("250")) {
    return phone.trim();
  }
  const local = msisdn.slice(3);
  return `+250 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
