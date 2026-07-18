import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { paymentRepository } from "@/repositories/payment.repository";
import { checkMtnPaymentStatus } from "@/lib/payments/mobile-money";
import { timingSafeEqualString } from "@/lib/security-access";

/**
 * MTN MoMo collection callback.
 * Never trust body status alone — re-query MTN when credentials exist.
 * Optional shared secret: MTN_MOMO_CALLBACK_SECRET (header x-callback-secret).
 */
export async function POST(req: Request) {
  try {
    const callbackSecret = process.env.MTN_MOMO_CALLBACK_SECRET;
    if (callbackSecret) {
      const provided = req.headers.get("x-callback-secret") || "";
      if (!timingSafeEqualString(provided, callbackSecret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const externalId =
      body.externalId ||
      body["external-id"] ||
      req.headers.get("x-reference-id") ||
      body.referenceId;

    if (!externalId) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const payment = await paymentRepository.findByExternalId(String(externalId));
    if (!payment) {
      // Do not reveal whether the id exists
      return NextResponse.json({ ok: true });
    }

    let status: "PENDING" | "SUCCESSFUL" | "FAILED" = "PENDING";

    if (process.env.MTN_MOMO_SUBSCRIPTION_KEY && payment.externalId) {
      status = await checkMtnPaymentStatus(payment.externalId);
    } else if (process.env.NODE_ENV !== "production") {
      // Local/dev without live MTN — allow body status only in non-production
      const claimed = String(
        body.status || (body.financialTransactionId ? "SUCCESSFUL" : "PENDING")
      ).toUpperCase();
      if (claimed === "SUCCESSFUL" || claimed === "SUCCESS") status = "SUCCESSFUL";
      else if (claimed === "FAILED" || claimed === "REJECTED") status = "FAILED";
    } else {
      // Production without ability to verify — reject confirmation from callback body
      return NextResponse.json({ error: "Provider verification unavailable" }, { status: 503 });
    }

    if (status === "SUCCESSFUL") {
      await paymentService.confirmPayment(payment.id);
    } else if (status === "FAILED") {
      await paymentService.failPayment(payment.id, "Customer declined or payment failed");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
