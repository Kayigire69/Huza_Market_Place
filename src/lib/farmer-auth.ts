/**
 * Farmers Portal authentication helpers (server-only).
 *
 * Current: phone + last 4 digits of National ID (no email/password/PIN).
 * Future (not implemented): SMS OTP, National Digital ID, biometrics, MoMo verify.
 * Keep verifyFarmerAccess() as the single gate so new factors can plug in here.
 *
 * Client UI must import display helpers from @/lib/farmer-id. Not this file.
 * so Next.js never bundles ioredis/dns into the browser.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  nationalIdLast4Matches,
} from "@/lib/farmer-id";

export {
  digitsOnly,
  normalizeRwandaPhone,
  nationalIdLast4,
  maskNationalId,
  nationalIdLast4Matches,
} from "@/lib/farmer-id";

export const FARMER_SESSION_DAYS_REMEMBER = 90;
export const FARMER_SESSION_DAYS_DEFAULT = 7;

/** Match security-access BCRYPT_ROUNDS without importing that module (avoids auth→redis chain). */
const BCRYPT_ROUNDS = 12;

/** Unusable random hash. Farmers never sign in with a password. */
export async function unusedFarmerPasswordHash(): Promise<string> {
  const random = crypto.randomBytes(32).toString("hex");
  return bcrypt.hash(`farmer-nid-auth:${random}`, BCRYPT_ROUNDS);
}

export type FarmerAuthFactor = "nid_last4"; // future: "sms_otp" | "digital_id" | "biometric"

/**
 * Pluggable verification. Today only NID last4.
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
