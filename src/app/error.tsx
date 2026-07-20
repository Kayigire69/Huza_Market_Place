"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
        HUZA FRESH
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--huza-green-dark)]">
        Something went wrong
      </h1>
      <p className="mt-4 text-[var(--huza-muted)] leading-relaxed">
        We couldn&apos;t complete that request. Your data is safe. Please try again, or contact Youth
        Huza support if it continues.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-[var(--huza-muted)]">Reference: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-[var(--huza-green)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
