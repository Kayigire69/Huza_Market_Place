import { SUPPORT_EMAIL } from "@/lib/brand-contact";

const ROLES = [
  {
    title: "Delivery rider",
    body: "Deliver HUZA FRESH orders across Kigali, Kamonyi, and Bugesera. Reliable transport and a valid phone are required.",
  },
  {
    title: "Warehouse / packing",
    body: "Receive, check, and pack produce at the Youth Huza warehouse before dispatch.",
  },
  {
    title: "Procurement / farmer liaison",
    body: "Work with verified farms, purchase orders, and quality checks so stock stays fresh on HUZA FRESH.",
  },
  {
    title: "Customer support",
    body: "Help customers with orders, payments, and delivery updates by phone and email.",
  },
];

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--huza-green)]">
        Powered by Youth Huza
      </p>
      <h1 className="section-title mt-2">Careers</h1>
      <div className="mt-8 space-y-5 text-[var(--huza-muted)] leading-relaxed">
        <p>
          <strong className="text-[var(--huza-ink)]">Youth Huza</strong> runs{" "}
          <strong className="text-[var(--huza-ink)]">HUZA FRESH</strong> — we buy from farms and sell
          fresh food to customers with one team for shop, payment, and delivery.
        </p>
        <p>
          We hire people who care about quality, reliability, and serving Rwanda. Roles may be
          full-time, part-time, or contract depending on need.
        </p>
      </div>

      <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
        Roles we often hire for
      </h2>
      <ul className="mt-4 space-y-4">
        {ROLES.map((role) => (
          <li
            key={role.title}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5"
          >
            <p className="font-semibold text-[var(--huza-ink)]">{role.title}</p>
            <p className="mt-2 text-sm text-[var(--huza-muted)] leading-relaxed">{role.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl border border-[var(--huza-line)] bg-white p-5 text-sm space-y-2">
        <p className="font-semibold text-[var(--huza-ink)]">How to apply</p>
        <p className="text-[var(--huza-muted)] leading-relaxed">
          Email your CV, phone number, and the role you want to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[var(--huza-green-dark)]">
            {SUPPORT_EMAIL}
          </a>
          . If there is no open seat right now, we still keep strong applications for when hiring
          starts.
        </p>
        <p className="text-[var(--huza-muted)]">Location: Kigali, Rwanda (and delivery zones we serve).</p>
      </div>
    </div>
  );
}
