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
          Customers shop only with Youth Huza — one brand, one customer service team, one payment
          recipient, and one delivery service. Quality and pricing stay under Huza control.
        </p>
        <p>
          Farms that want to sell produce <em>to</em> Youth Huza use the separate{" "}
          <strong className="text-[var(--huza-ink)]">Supplier Procurement Portal</strong>. After
          verification and purchase, stock is listed on HUZA FRESH under Youth Huza.
        </p>
        <p>
          Pay with MTN MoMo or Airtel Money (to Youth Huza). Browse in Kinyarwanda, English, or French.
          Delivery across Kigali, Kamonyi (Ruyenzi), and Bugesera (Nyamata).
        </p>
      </div>
    </div>
  );
}
