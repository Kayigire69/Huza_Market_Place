"use client";

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
import { useLocale } from "@/lib/locale-context";

const SECTIONS = [
  {
    titleKey: "growCardAgronomyTitle",
    bodyKey: "growCardAgronomyBody",
    href: "/farmer/agronomy",
    icon: Sprout,
  },
  {
    titleKey: "growCardTrainingTitle",
    bodyKey: "growCardTrainingBody",
    href: "/farmer/training",
    icon: BookOpen,
  },
  {
    titleKey: "growCardPracticesTitle",
    bodyKey: "growCardPracticesBody",
    href: "/farmer/training?topic=quality-standards",
    icon: Leaf,
  },
  {
    titleKey: "growCardWeatherTitle",
    bodyKey: "growCardWeatherBody",
    href: "/farmer/training",
    icon: CloudSun,
  },
  {
    titleKey: "growCardDiseaseTitle",
    bodyKey: "growCardDiseaseBody",
    href: "/farmer/training",
    icon: AlertTriangle,
  },
  {
    titleKey: "growCardPestTitle",
    bodyKey: "growCardPestBody",
    href: "/farmer/agronomy",
    icon: Bug,
  },
  {
    titleKey: "growCardVideosTitle",
    bodyKey: "growCardVideosBody",
    href: "/farmer/training",
    icon: Video,
  },
  {
    titleKey: "growCardDocsTitle",
    bodyKey: "growCardDocsBody",
    href: "/farmer/training",
    icon: FileText,
  },
  {
    titleKey: "growCardFaqTitle",
    bodyKey: "growCardFaqBody",
    href: "/farmer/training",
    icon: HelpCircle,
  },
  {
    titleKey: "growCardImproveTitle",
    bodyKey: "growCardImproveBody",
    href: "/farmer/produce?tab=approvals",
    icon: Leaf,
  },
] as const;

export function FarmerGrowBetterClient() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <FarmerPageHeader title={t("growBetterTitle")} />

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.titleKey} href={s.href} className="block">
              <FarmerPanel className="h-full transition hover:border-[var(--huza-green)]/50 hover:shadow-sm">
                <Icon className="size-6 text-[var(--huza-green-dark)]" />
                <h2 className="mt-3 text-base font-bold text-[var(--huza-ink)]">{t(s.titleKey)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--huza-muted)]">{t(s.bodyKey)}</p>
              </FarmerPanel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
