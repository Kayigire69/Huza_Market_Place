export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
      <h1 className="section-title">Customer support</h1>
      <p className="mt-4 text-[var(--huza-muted)]">
        Use the chat button at the bottom-right to message Youth Huza support, or visit{" "}
        <a href="/contact" className="text-[var(--huza-green)] font-semibold">
          Contact Us
        </a>
        .
      </p>
      <p className="mt-2 text-sm text-[var(--huza-muted)]">
        Track orders anytime at{" "}
        <a href="/track" className="text-[var(--huza-green)] font-semibold">
          /track
        </a>
        .
      </p>
    </div>
  );
}
