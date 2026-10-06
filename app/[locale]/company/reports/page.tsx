import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { companyAdmin, companyReports } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { fetchRecognitionReportRows, formatReportDate, getRecognitionReportRange } from "@/lib/reports/recognition-report";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Fields";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { Table } from "@/components/ui/Table";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "CA";
}

async function renderDemoReports(locale: string) {
  const t = await getTranslations({ locale, namespace: "companyPages" });

  return (
    <DashboardShell role="company" title={t("reportsTitle")} subtitle={t("reportsSubtitle")} user={companyAdmin}>
      <Grid cols="three">
        {companyReports.map((report) => (
          <Panel key={report.id} title={report.title} description={report.copy}>
            <Button href={`/${locale}/company`} variant="ghost" size="sm" arrow>
              {t("openReport")}
            </Button>
          </Panel>
        ))}
      </Grid>
    </DashboardShell>
  );
}

export default async function CompanyReportsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "companyPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!hasSupabaseServerConfig()) {
    return renderDemoReports(locale);
  }

  const range = getRecognitionReportRange(queryParams);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoReports(locale);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; first_name: string | null; last_name: string | null; role: string }>();

  if (profileError || !profile?.company_id) {
    redirect("/auth/repair-profile");
  }

  if (profile.role !== "company_admin") {
    redirect(`/${locale}/company`);
  }

  const [rows, unreadNotifications] = await Promise.all([
    fetchRecognitionReportRows(supabase, { kind: "company", companyId: profile.company_id }, range, locale),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  const exportHref = `/${locale}/company/reports/export?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
  const receiverCount = new Set(rows.map((row) => row.receiver)).size;
  const teamCount = new Set(rows.map((row) => row.team)).size;

  return (
    <DashboardShell
      role="company"
      title={t("reportsTitle")}
      subtitle={t("reportsSubtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || t("companyAdmin"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: t("companyAdmin")
      }}
      actions={
        <Button href={exportHref} variant="ghost" size="sm" icon={<Download />}>
          {t("exportCsv")}
        </Button>
      }
      unreadNotifications={unreadNotifications}
    >
      <Panel>
        <form className="lp-filters-bar" method="get">
          <Field label={t("dateFrom")} htmlFor="report-from">
            <Input id="report-from" type="date" name="from" defaultValue={range.from} />
          </Field>
          <Field label={t("dateTo")} htmlFor="report-to">
            <Input id="report-to" type="date" name="to" defaultValue={range.to} />
          </Field>
          <Button type="submit">{t("applyRange")}</Button>
          <Button href={`/${locale}/company/reports`} variant="ghost">
            {t("resetRange")}
          </Button>
        </form>
      </Panel>

      <Grid cols="three">
        <StatCard label={t("summaryRecognitions")} value={rows.length} helper={t("claimedInRange")} />
        <StatCard label={t("employeesTitle")} value={receiverCount} helper={t("recognizedRecipients")} />
        <StatCard label={t("teamsTitle")} value={teamCount} helper={t("representedInReport")} />
      </Grid>

      <Panel
        title={t("companyReportTitle")}
        description={t("reportIncludesCopy")}
        action={
          <Button href={exportHref} variant="ghost" size="sm" icon={<Download />}>
            {t("downloadCsv")}
          </Button>
        }
      >
        {rows.length ? (
          <Table className="lp-table-flat lp-table-stack">
            <thead>
              <tr>
                <th>{t("tableDate")}</th>
                <th>{t("tableReceiver")}</th>
                <th>{t("tableGiver")}</th>
                <th>{t("tableCard")}</th>
                <th>{t("tableCategory")}</th>
                <th>{t("team")}</th>
                <th>{t("tableNote")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-wide style={{ whiteSpace: "nowrap" }}>{formatReportDate(row.recognitionDate, locale)}</td>
                  <td data-label={t("tableReceiver")}><b style={{ fontWeight: 500 }}>{row.receiver}</b></td>
                  <td data-label={t("tableGiver")}>{row.giver}</td>
                  <td data-label={t("tableCard")}>{row.cardTitle}</td>
                  <td data-label={t("tableCategory")}>{row.category}</td>
                  <td data-label={t("team")}>{row.team}</td>
                  <td data-wide style={{ maxWidth: 280 }}>{row.personalNote || tc("noNote")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState eyebrow={t("noReportRowsEyebrow")} title={t("noRowsTitle")} copy={t("noRowsCopy")} />
        )}
      </Panel>
    </DashboardShell>
  );
}
