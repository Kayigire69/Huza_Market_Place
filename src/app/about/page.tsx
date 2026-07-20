import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "HUZA FRESH is Youth Huza’s online store. Fresh produce sold and delivered across Rwanda.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--huza-green)]">
        Powered by Youth Huza
      </p>
      <h1 className="section-title mt-2">About HUZA FRESH</h1>
      <div className="mt-8 space-y-5 text-[var(--huza-muted)] leading-relaxed">
        <p>
          <strong className="text-[var(--huza-ink)]">HUZA FRESH</strong> is the online store of{" "}
          <strong className="text-[var(--huza-ink)]">Youth Huza</strong>. We buy fresh produce from
          verified farms at wholesale, then <strong>we sell and deliver</strong> it to customers at
          retail.
        </p>
        <p>
          Customers shop only with Youth Huza. One brand, one customer service team, one payment
          recipient, and one delivery service. Quality and pricing stay under Huza control.
        </p>
        <p>
          Farms partner with Youth Huza through a <strong className="text-[var(--huza-ink)]">private
          Farmers Portal</strong> (shared by Huza staff, not listed on this customer site). After
          verification and purchase, stock is listed on HUZA FRESH under Youth Huza. Customers never
          see farm names on the shop.
        </p>
        <p>
          Pay Youth Huza with MTN MoMo or Airtel Money (bank cards coming soon; no Cash on
          Delivery). Browse in Kinyarwanda, English, French, or Kiswahili.
          Delivery across Kigali, Kamonyi, and Bugesera (5,000 RWF flat fee).
        </p>
      </div>
    </div>
  );
}
