"use client";

/**
 * Root-level error boundary (required by Next.js App Router).
 * Must define its own <html>/<body> — used when the root layout fails.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#F7FBF8",
          color: "#1A2E24",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "6rem 1rem", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "#1B7A4E" }}>
            HUZA FRESH
          </p>
          <h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 700, color: "#0F3D2E" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: 16, lineHeight: 1.6, color: "#5A6B62" }}>
            We couldn&apos;t load the page. Please try again.
          </p>
          {error.digest ? (
            <p style={{ marginTop: 8, fontSize: 12, color: "#5A6B62" }}>Reference: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              border: "none",
              borderRadius: 999,
              background: "#1B7A4E",
              color: "#fff",
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
