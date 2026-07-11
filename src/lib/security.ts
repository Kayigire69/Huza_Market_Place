import crypto from "crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

export function generateTotpSecret() {
  return generateSecret();
}

export function totpKeyuri(email: string, secret: string) {
  return generateURI({
    issuer: "HUZA Admin",
    label: email,
    secret,
  });
}

export async function totpQrDataUrl(email: string, secret: string) {
  return QRCode.toDataURL(totpKeyuri(email, secret));
}

export function verifyTotp(token: string, secret: string) {
  const result = verifySync({
    token: token.replace(/\s/g, ""),
    secret,
  });
  return Boolean(result && (result as { valid?: boolean }).valid);
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
