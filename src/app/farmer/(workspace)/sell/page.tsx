import Link from "next/link";
import { ArrowRight, Handshake, ShoppingCart } from "lucide-react";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

/**
 * Sell to HUZA — two clearly separated commercial models.
 * Existing produce submit / PO / payment workflows stay under these doors.
 */
export default async function FarmerSellPage() {
  await requireFarmerWorkspace();

  return (
    <div className="space-y-6">
      <FarmerPageHeader
        title="Sell to HUZA"
        subtitle="Choose how you want Youth Huza to work with your harvest. These are two different paths — never mixed."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FarmerPanel className="border-[var(--huza-green)]/40 bg-[var(--huza-mint)]/25">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white p-2.5 shadow-sm">
              <ShoppingCart className="size-6 text-[var(--huza-green-dark)]" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
                Option A
              </p>
              <h2 className="mt-1 text-xl font-bold text-[var(--huza-ink)]">Direct Sale to HUZA</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--huza-muted)]">
            HUZA purchases your produce. After inspection and agreed price, you receive full payment.
            Ownership moves to HUZA. Your crop enters HUZA inventory and can appear on the HUZA FRESH
            website with official HUZA photos.
          </p>
          <ol className="mt-4 space-y-2 text-sm text-[var(--huza-ink)]">
            {[
              "Submit harvest",
              "HUZA inspects & grades",
              "Price agreed",
              "Full payment to you",
              "Ownership transfers to HUZA",
            ].map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-bold text-[var(--huza-green-dark)]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">
            Payment may be farm-gate, upon delivery, bank transfer, or mobile money — as agreed.
            <strong className="text-[var(--huza-ink)]"> No commission on this path.</strong>
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/farmer/produce?tab=submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--huza-green)] px-4 py-3 text-sm font-bold text-white"
            >
              Submit for direct sale <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/farmer/sales"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--huza-ink)]"
            >
              View buy orders & payments
            </Link>
          </div>
        </FarmerPanel>

        <FarmerPanel className="border-[#c9a227]/50 bg-[#FFF8E6]/60">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white p-2.5 shadow-sm">
              <Handshake className="size-6 text-[#8a6a10]" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a6a10]">
                Option B
              </p>
              <h2 className="mt-1 text-xl font-bold text-[var(--huza-ink)]">
                HUZA Marketing Partnership
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--huza-muted)]">
            You keep ownership. HUZA markets and sells on the shop for you (consignment). After sales,
            HUZA deducts the agreed commission; you receive the remaining balance and a sales report.
          </p>
          <ol className="mt-4 space-y-2 text-sm text-[var(--huza-ink)]">
            {[
              "Submit harvest",
              "HUZA inspects & grades",
              "Listed for customers",
              "Sales happen",
              "Commission deducted · you are paid the rest",
            ].map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-bold text-[#8a6a10]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-[var(--huza-muted)]">
            Track sold stock, remaining stock, HUZA commission, your earnings, and settlement dates in
            Payments. Commission % is set by Youth Huza (Super Admin).
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/farmer/produce?tab=submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a227] px-4 py-3 text-sm font-bold text-[var(--huza-ink)]"
            >
              Submit for partnership <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/farmer/sales?tab=payments"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--huza-ink)]"
            >
              Partnership payments & reports
            </Link>
          </div>
        </FarmerPanel>
      </div>

      <FarmerPanel>
        <h3 className="font-bold text-[var(--huza-ink)]">Quality grades (after HUZA inspection)</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { g: "Grade 1", d: "Premium quality · highest selling price" },
            { g: "Grade 2", d: "Standard quality · average selling price" },
            { g: "Grade 3", d: "Lower quality · lower selling price" },
          ].map((x) => (
            <div key={x.g} className="rounded-xl bg-[var(--huza-mint)]/40 px-3 py-3 text-sm">
              <p className="font-bold text-[var(--huza-green-dark)]">{x.g}</p>
              <p className="mt-1 text-[var(--huza-muted)]">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--huza-muted)]">
          Grades are assigned only after HUZA inspection — not by self-declaration alone.
        </p>
      </FarmerPanel>
    </div>
  );
}
