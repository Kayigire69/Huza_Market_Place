import Link from "next/link";
import {
  BookOpen,
  Bug,
  CloudSun,
  FileText,
  HelpCircle,
  Leaf,
  Sprout,
  Video,
  AlertTriangle,
} from "lucide-react";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "Agronomy Support",
    body: "Ask an expert or request a farm visit. Youth Huza agronomy teams help you grow healthier crops.",
    href: "/farmer/agronomy",
    icon: Sprout,
  },
  {
    title: "Training & Advisory",
    body: "Short guides on soil, organic practice, pests, fertilizer, irrigation, harvest and markets.",
    href: "/farmer/training",
    icon: BookOpen,
  },
  {
    title: "Best Farming Practices",
    body: "Practical steps aligned with good agricultural practice — clear language for every farmer.",
    href: "/farmer/training?topic=quality-standards",
    icon: Leaf,
  },
  {
    title: "Weather Information",
    body: "Seasonal tips so you plan planting, spraying and harvest with more confidence.",
    href: "/farmer/training",
    icon: CloudSun,
  },
  {
    title: "Disease Alerts",
    body: "Watch for common crop diseases and what to do early.",
    href: "/farmer/training",
    icon: AlertTriangle,
  },
  {
    title: "Pest Alerts",
    body: "Identify pests and safer control options with advisory support.",
    href: "/farmer/agronomy",
    icon: Bug,
  },
  {
    title: "Videos",
    body: "Short training videos will appear here as Youth Huza publishes them.",
    href: "/farmer/training",
    icon: Video,
  },
  {
    title: "Documents",
    body: "Downloadable checklists and farmer guides (PDF) as they are published.",
    href: "/farmer/training",
    icon: FileText,
  },
  {
    title: "Frequently Asked Questions",
    body: "Simple answers about selling to HUZA, farm visits, quality and payments.",
    href: "/farmer/training",
    icon: HelpCircle,
  },
  {
    title: "Farm Improvement Recommendations",
    body: "After inspection, Huza shares what to improve next season — see Approvals and Messages.",
    href: "/farmer/produce?tab=approvals",
    icon: Leaf,
  },
] as const;

export default async function GrowBetterPage() {
  await requireFarmerWorkspace();

  return (
    <div className="space-y-6">
      <FarmerPageHeader
        title="Grow Better"
        subtitle="Youth Huza is your agricultural partner — agronomy, training, and practical advice so your farm improves every season."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.title} href={s.href} className="block">
              <FarmerPanel className="h-full transition hover:border-[var(--huza-green)]/50 hover:shadow-sm">
                <Icon className="size-6 text-[var(--huza-green-dark)]" />
                <h2 className="mt-3 text-base font-bold text-[var(--huza-ink)]">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--huza-muted)]">{s.body}</p>
              </FarmerPanel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
