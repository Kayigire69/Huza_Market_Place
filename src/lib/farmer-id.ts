/**
 * Client-safe farmer identity helpers (no Node/redis/bcrypt).
 * Server auth builds on these in farmer-auth.ts.
 */

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeRwandaPhone(phone: string): string {
  let d = digitsOnly(phone);
  if (d.startsWith("250") && d.length >= 12) d = d.slice(3);
  if (d.length === 9 && d.startsWith("7")) d = `0${d}`;
  return d;
}

export function nationalIdLast4(nationalId: string | null | undefined): string | null {
  const d = digitsOnly(nationalId || "");
  if (d.length < 4) return null;
  return d.slice(-4);
}

/** Mask for display: show only last 4 (e.g. ******4827) */
export function maskNationalId(nationalId: string | null | undefined): string {
  const d = digitsOnly(nationalId || "");
  if (d.length < 4) return "—";
  return `${"*".repeat(Math.max(4, d.length - 4))}${d.slice(-4)}`;
}

export function nationalIdLast4Matches(
  storedNationalId: string | null | undefined,
  enteredLast4: string
): boolean {
  const expected = nationalIdLast4(storedNationalId);
  const got = digitsOnly(enteredLast4);
  if (!expected || got.length !== 4) return false;
  return expected === got;
}
