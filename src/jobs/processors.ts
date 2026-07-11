import type { Prisma } from "@prisma/client";
import { jobRepository } from "@/repositories/job.repository";
import { paymentService } from "@/services/payment.service";
import { enqueueJob } from "@/jobs/queue";
import { prisma } from "@/lib/prisma";

type Payload = Record<string, unknown>;

async function processSendEmail(payload: Payload) {
  const to = String(payload.to || "");
  const subject = String(payload.subject || "");
  const body = String(payload.body || "");
  // Provider hook — logs until SMTP/Resend is configured
  console.info("[job:SEND_EMAIL]", { to, subject, body: body.slice(0, 120) });
  await prisma.notification.create({
    data: {
      type: "ORDER_CONFIRMATION",
      channel: "EMAIL",
      title: subject || "Email",
      body: `To: ${to} — ${body}`.slice(0, 500),
    },
  });
}

async function processSendSms(payload: Payload) {
  const to = String(payload.to || "");
  const body = String(payload.body || "");
  console.info("[job:SEND_SMS]", { to, body: body.slice(0, 120) });
  await prisma.notification.create({
    data: {
      type: "PAYMENT_CONFIRMATION",
      channel: "SMS",
      title: "SMS",
      body: `To: ${to} — ${body}`.slice(0, 500),
    },
  });
}

async function processAnalytics(payload: Payload) {
  console.info("[job:UPDATE_ANALYTICS]", payload.event, payload.data);
}

async function processReport(payload: Payload) {
  console.info("[job:GENERATE_REPORT]", payload.reportType, payload.params);
  await prisma.notification.create({
    data: {
      type: "ORDER_CONFIRMATION",
      channel: "IN_APP",
      title: `Report: ${String(payload.reportType || "unknown")}`,
      body: JSON.stringify(payload.params || {}).slice(0, 500),
    },
  });
}

async function processPaymentVerify(payload: Payload) {
  const paymentId = String(payload.paymentId || "");
  if (!paymentId) throw new Error("paymentId required");
  const result = await paymentService.verifyPendingPayment(paymentId);
  // Keep polling while still pending (background verification loop)
  if (result.status === "PENDING") {
    await enqueueJob(
      "PAYMENT_VERIFY",
      { ...payload } as Prisma.InputJsonValue,
      { runAfter: new Date(Date.now() + 5_000), maxAttempts: 20 }
    );
  }
}

export async function processJobById(jobId: string) {
  const job = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, reason: "missing" };
  if (job.status === "COMPLETED") return { ok: true, skipped: true };

  try {
    const payload = (job.payload || {}) as Payload;
    switch (job.type) {
      case "PAYMENT_VERIFY":
        await processPaymentVerify(payload);
        break;
      case "SEND_EMAIL":
        await processSendEmail(payload);
        break;
      case "SEND_SMS":
        await processSendSms(payload);
        break;
      case "UPDATE_ANALYTICS":
        await processAnalytics(payload);
        break;
      case "GENERATE_REPORT":
        await processReport(payload);
        break;
      default:
        console.warn("[job] unknown type", job.type);
    }
    await jobRepository.complete(job.id);
    return { ok: true, type: job.type };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";
    await jobRepository.fail(job.id, message);
    return { ok: false, error: message, type: job.type };
  }
}

/** Claim and process a batch of due jobs (DB-backed queue). */
export async function processDueJobs(limit = 10) {
  const claimed = await jobRepository.claimNext(limit);
  const results = [];
  for (const job of claimed) {
    results.push(await processJobById(job.id));
  }
  return { processed: results.length, results };
}
