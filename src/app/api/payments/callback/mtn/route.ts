import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { paymentRepository } from "@/repositories/payment.repository";

/**
 * MTN MoMo collection callback.
 * Configure MTN_MOMO_CALLBACK_URL to https://your-domain/api/payments/callback/mtn
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const externalId =
      body.externalId ||
      body["external-id"] ||
      req.headers.get("x-reference-id") ||
      body.referenceId;
    const status = String(
      body.status || (body.financialTransactionId ? "SUCCESSFUL" : "PENDING")
    ).toUpperCase();

    if (!externalId) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const payment = await paymentRepository.findByExternalId(String(externalId));
    if (!payment) {
      return NextResponse.json({ ok: true, note: "Unknown payment" });
    }

    if (status === "SUCCESSFUL" || status === "SUCCESS") {
      await paymentService.confirmPayment(payment.id);
    } else if (status === "FAILED" || status === "REJECTED") {
      await paymentService.failPayment(payment.id, "Customer declined or payment failed");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
