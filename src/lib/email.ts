/**
 * Thin email adapter. Logs in development; uses Resend when RESEND_API_KEY is set.
 * Forgot-password for Super Admin relies on the owner's email inbox.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "HUZA FRESH <noreply@youthhuza.rw>";

  if (!apiKey) {
    // Never log reset tokens / full message bodies
    console.info("[email:dev]", { to: input.to, subject: input.subject, preview: input.text.slice(0, 80) });
    return { ok: true, mode: "console" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html || `<pre>${input.text}</pre>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email:resend]", res.status, body);
    throw new Error("Failed to send email");
  }

  return { ok: true, mode: "resend" as const };
}
