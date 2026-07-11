import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
        HUZA FRESH
      </p>
      <h1 className="section-title mt-2">Refund Policy</h1>
      <div className="mt-6 space-y-4 text-[var(--huza-muted)] leading-relaxed">
        <p>
          If produce arrives damaged, incorrect, or not as described, contact Youth Huza within 24
          hours of delivery with your order number (e.g. HZ-2026-000245) and photos when possible.
        </p>
        <p>
          Approved refunds are returned via the original Mobile Money method or as store credit.
          Cash-on-delivery orders may be credited on a future order after verification.
        </p>
        <p>
          Perishable goods that were accepted at the door in good condition are generally not
          refundable, except where Youth Huza confirms a quality issue.
        </p>
      </div>
      <Link href="/support" className="mt-8 inline-block font-semibold text-[var(--huza-green)]">
        Open a support ticket →
      </Link>
    </div>
  );
}
