"use client";

type Cred = { label: string; email: string; password: string; note?: string };

export function DemoCredentials({
  title = "Demo access (for testing)",
  credentials,
}: {
  title?: string;
  credentials: Cred[];
}) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-[var(--huza-green)] bg-[var(--huza-mint)]/40 p-5 text-left">
      <p className="text-sm font-semibold text-[var(--huza-green-dark)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--huza-muted)]">
        Use these accounts to open the portal. Password is the same for all demo users.
      </p>
      <ul className="mt-4 space-y-3">
        {credentials.map((c) => (
          <li key={c.email} className="rounded-xl bg-white/80 px-3 py-2 text-sm">
            <p className="font-medium text-[var(--huza-ink)]">{c.label}</p>
            <p className="mt-0.5 font-mono text-xs text-[var(--huza-green-dark)]">
              {c.email} · {c.password}
            </p>
            {c.note && <p className="mt-1 text-xs text-[var(--huza-muted)]">{c.note}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--huza-muted)]">
        Log in at{" "}
        <a href="/auth/login" className="font-semibold text-[var(--huza-green)] underline">
          /auth/login
        </a>
      </p>
    </div>
  );
}
