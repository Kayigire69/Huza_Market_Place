"use client";

import Link from "next/link";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { FarmerHubTabs } from "@/components/portals/FarmerHubTabs";
import { useLocale } from "@/lib/locale-context";

export function FarmerProduceHeader({
  tab,
  listed,
}: {
  tab: string;
  listed: number;
}) {
  const { t } = useLocale();

  const produceTabs = [
    {
      href: "/farmer/produce",
      labelKey: "tabAllProduce",
      match: (p: string, tabParam: string | null) =>
        (p.startsWith("/farmer/produce") && !tabParam) || p === "/farmer/products",
    },
    {
      href: "/farmer/produce?tab=submit",
      labelKey: "tabSubmitCrop",
      match: (p: string, tabParam: string | null) =>
        tabParam === "submit" || p.startsWith("/farmer/products/submit"),
    },
    {
      href: "/farmer/produce?tab=approvals",
      labelKey: "tabApprovalStatus",
      match: (p: string, tabParam: string | null) =>
        tabParam === "approvals" || p.startsWith("/farmer/approvals"),
    },
  ];

  return (
    <>
      <FarmerPageHeader
        title={t("produceTitle")}
        action={
          tab !== "submit" ? (
            <Link href="/farmer/produce?tab=submit">
              <Button variant={listed === 0 ? "primary" : "ghost"}>
                {listed === 0 ? t("produceSubmitMain") : t("produceSubmitAnother")}
              </Button>
            </Link>
          ) : null
        }
      />
      <FarmerHubTabs tabs={produceTabs} />
    </>
  );
}
