import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";

export default async function AdminDemoAccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });

  return (
    <DashboardShell role="admin" title={t("demoAccountsTitle")} subtitle={t("demoAccountsSubtitle")} user={superAdminUser}>
      <article className="panel dashboard-panel">
        <EmptyState
          eyebrow={t("demoAccountsDisabledEyebrow")}
          title={t("demoAccountsEmptyTitle")}
          copy={t("demoAccountsEmptyCopy")}
        />
      </article>
    </DashboardShell>
  );
}
