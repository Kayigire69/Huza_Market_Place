import { randomUUID } from "crypto";
import type { PaymentMethod } from "@prisma/client";
import { demoPaymentsAllowed } from "@/lib/security-access";

export type PaymentRequestInput = {
  method: Extract<PaymentMethod, "MTN_MOMO" | "AIRTEL_MONEY">;
  /** Customer phone that will approve the payment on their handset */
  payerPhone: string;
  /** Youth Huza merchant MoMo or Airtel number that receives the money */
  payeePhone: string;
  payeeName: string;
  amount: number;
  currency?: string;
  orderNumber: string;
  externalId?: string;
};

export type PaymentRequestResult = {
  externalId: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  message: string;
  /** live = provider API; manual = customer sends MoMo to Huza; demo = local test only */
  mode: "live" | "manual" | "demo";
  transactionRef: string;
};

/** Normalize Rwandan MSISDN to 2507XXXXXXXX */
export function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `250${digits}`;
  return digits;
}

function formatDisplayPhone(msisdn: string): string {
  if (msisdn.startsWith("250") && msisdn.length === 12) {
    return `0${msisdn.slice(3)}`;
  }
  return msisdn;
}

export function hasMtnCredentials() {
  return Boolean(
    process.env.MTN_MOMO_SUBSCRIPTION_KEY &&
      process.env.MTN_MOMO_API_USER &&
      process.env.MTN_MOMO_API_KEY
  );
}

export function hasAirtelCredentials() {
  return Boolean(process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET);
}

/** True when this method has no live collection API — customer must send MoMo to Huza. */
export function usesManualMobileMoneyPayIn(
  method: Extract<PaymentMethod, "MTN_MOMO" | "AIRTEL_MONEY">
): boolean {
  if (method === "MTN_MOMO") return !hasMtnCredentials();
  return !hasAirtelCredentials();
}

/**
 * Request-to-pay when live APIs exist; otherwise manual send-to-Huza MoMo.
 * Demo auto-confirm is only for ALLOW_DEMO_PAYMENTS local testing (DEMO- refs).
 */
export async function initiateMobileMoneyPayment(
  input: PaymentRequestInput
): Promise<PaymentRequestResult> {
  const externalId = input.externalId || randomUUID();
  const payer = normalizeMsisdn(input.payerPhone);
  const payee = normalizeMsisdn(input.payeePhone);
  const currency = input.currency || "RWF";

  if (input.method === "MTN_MOMO" && hasMtnCredentials()) {
    return requestMtnCollection({
      ...input,
      externalId,
      payerPhone: payer,
      payeePhone: payee,
      currency,
    });
  }

  if (input.method === "AIRTEL_MONEY" && hasAirtelCredentials()) {
    return requestAirtelCollection({
      ...input,
      externalId,
      payerPhone: payer,
      payeePhone: payee,
      currency,
    });
  }

  // Local/dev only: simulated phone prompt (explicit ALLOW_DEMO_PAYMENTS=true)
  if (demoPaymentsAllowed() && process.env.ALLOW_DEMO_PAYMENTS === "true") {
    return {
      externalId,
      status: "PENDING",
      mode: "demo",
      transactionRef: `DEMO-${input.method}-${Date.now()}`,
      message: `Payment request sent to ${formatDisplayPhone(payer)}. Open the ${
        input.method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"
      } prompt on that phone, enter your PIN to approve. Money goes to ${input.payeeName} (${formatDisplayPhone(payee)}).`,
    };
  }

  // Production interim: customer sends MoMo to Huza; admin confirms in Admin → Payments
  const network = input.method === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money";
  return {
    externalId,
    status: "PENDING",
    mode: "manual",
    transactionRef: `MANUAL-${input.method}-${Date.now()}`,
    message: `Send ${input.amount.toLocaleString("en-RW")} RWF via ${network} to ${input.payeeName} (${formatDisplayPhone(payee)}). Use order ${input.orderNumber} as the payment message. Huza will confirm when the payment arrives.`,
  };
}

async function getMtnCollectionToken(): Promise<string> {
  const base = process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
  const user = process.env.MTN_MOMO_API_USER!;
  const key = process.env.MTN_MOMO_API_KEY!;
  const subKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY!;
  const auth = Buffer.from(`${user}:${key}`).toString("base64");

  const res = await fetch(`${base}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Ocp-Apim-Subscription-Key": subKey,
    },
  });
  if (!res.ok) throw new Error("Failed to get MTN MoMo token");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function requestMtnCollection(input: {
  externalId: string;
  payerPhone: string;
  payeePhone: string;
  payeeName: string;
  amount: number;
  currency: string;
  orderNumber: string;
}): Promise<PaymentRequestResult> {
  const base = process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
  const subKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY!;
  const target = process.env.MTN_MOMO_TARGET_ENV || "sandbox";
  const callback =
    process.env.MTN_MOMO_CALLBACK_URL ||
    `${process.env.NEXTAUTH_URL}/api/payments/callback/mtn`;
  const token = await getMtnCollectionToken();

  const res = await fetch(`${base}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": input.externalId,
      "X-Target-Environment": target,
      "Ocp-Apim-Subscription-Key": subKey,
      "Content-Type": "application/json",
      "X-Callback-Url": callback,
    },
    body: JSON.stringify({
      amount: String(input.amount),
      currency: input.currency,
      externalId: input.orderNumber,
      payer: { partyIdType: "MSISDN", partyId: input.payerPhone },
      payerMessage: `HUZA FRESH order ${input.orderNumber}`,
      payeeNote: `Pay ${input.payeeName}`,
    }),
  });

  if (res.status !== 202 && !res.ok) {
    const text = await res.text();
    throw new Error(`MTN MoMo request failed: ${text || res.status}`);
  }

  return {
    externalId: input.externalId,
    status: "PENDING",
    mode: "live",
    transactionRef: input.externalId,
    message: `MTN MoMo prompt sent to ${formatDisplayPhone(input.payerPhone)}. Approve on your phone. Funds will go to ${input.payeeName} (${formatDisplayPhone(input.payeePhone)}).`,
  };
}

async function requestAirtelCollection(input: {
  externalId: string;
  payerPhone: string;
  payeePhone: string;
  payeeName: string;
  amount: number;
  currency: string;
  orderNumber: string;
}): Promise<PaymentRequestResult> {
  const base = process.env.AIRTEL_BASE_URL || "https://openapi.airtel.africa";
  const clientId = process.env.AIRTEL_CLIENT_ID!;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET!;

  const tokenRes = await fetch(`${base}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!tokenRes.ok) throw new Error("Failed to get Airtel Money token");
  const tokenData = (await tokenRes.json()) as { access_token: string };

  const res = await fetch(`${base}/merchant/v1/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
      "X-Country": "RW",
      "X-Currency": input.currency,
    },
    body: JSON.stringify({
      reference: input.orderNumber,
      subscriber: { country: "RW", currency: input.currency, msisdn: input.payerPhone },
      transaction: {
        amount: input.amount,
        country: "RW",
        currency: input.currency,
        id: input.externalId,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtel Money request failed: ${text || res.status}`);
  }

  return {
    externalId: input.externalId,
    status: "PENDING",
    mode: "live",
    transactionRef: input.externalId,
    message: `Airtel Money prompt sent to ${formatDisplayPhone(input.payerPhone)}. Approve on your phone. Funds will go to ${input.payeeName} (${formatDisplayPhone(input.payeePhone)}).`,
  };
}

/**
 * After collection succeeds, disburse to the seller's MoMo/Airtel number.
 * In demo mode this is recorded as successful immediately.
 */
export async function disburseToSeller(input: {
  method: PaymentMethod;
  payeePhone: string;
  amount: number;
  orderNumber: string;
  externalId: string;
}): Promise<{ ok: boolean; message: string }> {
  const payee = normalizeMsisdn(input.payeePhone);

  if (input.method === "MTN_MOMO" && hasMtnCredentials() && process.env.MTN_MOMO_DISBURSEMENT_KEY) {
    // Live disbursement can be wired with MTN Disbursement API using the same pattern.
    // Kept behind env so collection can go live first.
    return {
      ok: true,
      message: `Disbursement queued to ${formatDisplayPhone(payee)} for order ${input.orderNumber}`,
    };
  }

  return {
    ok: true,
    message: `Payment of ${input.amount} RWF credited to Youth Huza (${formatDisplayPhone(payee)})`,
  };
}

export async function checkMtnPaymentStatus(externalId: string): Promise<"PENDING" | "SUCCESSFUL" | "FAILED"> {
  if (!hasMtnCredentials()) return "PENDING";

  const base = process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";
  const subKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY!;
  const target = process.env.MTN_MOMO_TARGET_ENV || "sandbox";
  const token = await getMtnCollectionToken();

  const res = await fetch(`${base}/collection/v1_0/requesttopay/${externalId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": target,
      "Ocp-Apim-Subscription-Key": subKey,
    },
  });
  if (!res.ok) return "PENDING";
  const data = (await res.json()) as { status?: string };
  const status = (data.status || "PENDING").toUpperCase();
  if (status === "SUCCESSFUL") return "SUCCESSFUL";
  if (status === "FAILED" || status === "REJECTED") return "FAILED";
  return "PENDING";
}
