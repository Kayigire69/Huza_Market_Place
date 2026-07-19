/**
 * Farmers Portal authentication helpers.
 *
 * Current: phone + last 4 digits of National ID (no email/password/PIN).
 * Future (not implemented): SMS OTP, National Digital ID, biometrics, MoMo verify.
 * Keep verifyFarmerAccess() as the single gate so new factors can plug in here.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/security-access";

export const FARMER_SESSION_DAYS_REMEMBER = 90;
export const FARMER_SESSION_DAYS_DEFAULT = 7;

/** Digits only — Rwanda phone / National ID cleanup */
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

/** Unusable random hash — farmers never sign in with a password. */
export async function unusedFarmerPasswordHash(): Promise<string> {
  const random = crypto.randomBytes(32).toString("hex");
  return bcrypt.hash(`farmer-nid-auth:${random}`, BCRYPT_ROUNDS);
}

export type FarmerAuthFactor = "nid_last4"; // future: "sms_otp" | "digital_id" | "biometric"

/**
 * Pluggable verification — today only NID last4.
 * Later: chain SMS OTP / digital ID without rewriting callers.
 */
export function verifyFarmerAccess(args: {
  storedNationalId: string | null | undefined;
  nationalIdLast4: string;
  factor?: FarmerAuthFactor;
}): boolean {
  const factor = args.factor || "nid_last4";
  if (factor === "nid_last4") {
    return nationalIdLast4Matches(args.storedNationalId, args.nationalIdLast4);
  }
  return false;
}
