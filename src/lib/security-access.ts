import { createHmac, timingSafeEqual } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { normalizeMsisdn } from "@/lib/payments/mobile-money";

/** bcrypt cost for new password hashes */
export const BCRYPT_ROUNDS = 12;

function docSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.JOBS_SECRET || "huza-dev-doc-secret";
}

/** Short-lived HMAC so invoice/receipt links work without exposing bare order numbers. */
export function createOrderDocToken(orderNumber: string, ttlMs = 7 * 24 * 60 * 60 * 1000): string {
  const exp = Math.floor((Date.now() + ttlMs) / 1000);
  const payload = `${orderNumber}.${exp}`;
  const sig = createHmac("sha256", docSecret()).update(payload).digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyOrderDocToken(orderNumber: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!expStr || !sig || !Number.isFinite(exp)) return false;
  if (exp * 1000 < Date.now()) return false;
  const payload = `${orderNumber}.${exp}`;
  const expected = createHmac("sha256", docSecret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function phonesMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const na = normalizeMsisdn(a);
  const nb = normalizeMsisdn(b);
  if (na && nb && na === nb) return true;
  return na.slice(-9) === nb.slice(-9);
}

type OrderAccessShape = {
  userId?: string | null;
  guestPhone?: string | null;
  payment?: { phoneNumber?: string | null } | null;
  user?: { phone?: string | null } | null;
};

/** Session owner, admin staff, matching phone, or valid doc token. */
export async function canAccessOrder(
  order: OrderAccessShape,
  opts: {
    req: Request;
    orderNumber: string;
    phone?: string | null;
    token?: string | null;
  }
): Promise<boolean> {
  if (verifyOrderDocToken(opts.orderNumber, opts.token)) return true;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (role && isAdminPortalRole(role)) return true;
  if (session?.user?.id && order.userId && session.user.id === order.userId) return true;

  const phone = opts.phone?.trim();
  if (phone) {
    if (phonesMatch(phone, order.guestPhone)) return true;
    if (phonesMatch(phone, order.payment?.phoneNumber)) return true;
    if (phonesMatch(phone, order.user?.phone)) return true;
  }

  return false;
}

export function timingSafeEqualString(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Demo MoMo only when explicitly allowed (never silent in production). */
export function demoPaymentsAllowed(): boolean {
  if (process.env.ALLOW_DEMO_PAYMENTS === "true") return true;
  return process.env.NODE_ENV !== "production";
}
