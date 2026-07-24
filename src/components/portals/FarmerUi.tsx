import Link from "next/link";

/** Shared panel chrome for farmer workspace pages */
export function FarmerPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--huza-ink)] sm:text-[1.75rem]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-[var(--huza-muted)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function FarmerPanel({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-[var(--huza-line)] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function FarmerComingSoon({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <FarmerPanel className="max-w-2xl">
      <p className="inline-block rounded-md bg-[var(--huza-mint)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
        Coming next
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--huza-muted)]">{body}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline decoration-[var(--huza-green)] underline-offset-4"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </FarmerPanel>
  );
}
