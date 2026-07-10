export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--huza-green)]">
        Powered by Youth Huza
      </p>
      <h1 className="section-title mt-2">About HUZA MARKETPLACE</h1>
      <div className="mt-8 space-y-5 text-[var(--huza-muted)] leading-relaxed">
        <p>
          <strong className="text-[var(--huza-ink)]">HUZA MARKETPLACE</strong> is the store of{" "}
          <strong className="text-[var(--huza-ink)]">Youth Huza</strong>. We buy fresh produce from
          trusted farms, then <strong>we sell and deliver</strong> it to customers.
        </p>
        <p>
          Customers shop with Youth Huza — not with individual suppliers on a commission marketplace.
          That way quality, pricing, payment, and delivery stay under Huza.
        </p>
        <p>
          <strong className="text-[var(--huza-ink)]">Farm partners</strong> use the “Sell to Huza”
          portal when they want Youth Huza to purchase their stock. After Huza buys an offer, those
          products can appear in our store for customers.
        </p>
        <p>
          Pay with MTN MoMo or Airtel Money (to Youth Huza). Browse in Kinyarwanda, English, or French.
          Delivery across Kigali, Kamonyi (Ruyenzi), and Bugesera (Nyamata).
        </p>
      </div>
    </div>
  );
}
