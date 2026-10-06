import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { managerUser } from "@/lib/demo-data";
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
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

async function renderDemoReports(locale: string) {
  const tp = await getTranslations({ locale, namespace: "managerPages" });

  return (
    <DashboardShell role="manager" title={tp("reportsTitle")} subtitle={tp("reportsSubtitleDemo")} user={managerUser}>
      <Grid cols="three">
        {[
          [tp("demoQuarterlyTitle"), tp("demoQuarterlyCopy")],
          [tp("demoOneToOneTitle"), tp("demoOneToOneCopy")],
          [tp("demoPulseTitle"), tp("demoPulseCopy")]
        ].map(([title, copy]) => (
          <Panel key={title} title={title} description={copy}>
            <Button href="/manager" variant="ghost" size="sm" arrow>
              {tp("openReport")}
            </Button>
          </Panel>
        ))}
      </Grid>
    </DashboardShell>
  );
}

export default async function ManagerReportsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tm = await getTranslations({ locale, namespace: "manager" });
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

  if (profileError || !profile) {
    redirect("/auth/repair-profile");
  }

  if (profile.role !== "manager") {
    redirect(`/${locale}/manager`);
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("manager_id", user.id)
    .order("name");

  if (teamsError) {
    throw new Error(tp("errLoadReportTeams"));
  }

  const teamIds = (teams ?? []).map((team) => team.id);
  const [rows, unreadNotifications] = await Promise.all([
    fetchRecognitionReportRows(supabase, { kind: "teams", companyId: profile.company_id, teamIds }, range, locale),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  const exportHref = `/${locale}/manager/reports/export?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
  const receiverCount = new Set(rows.map((row) => row.receiver)).size;
  const teamLabel =
    teams?.length === 1
      ? teams[0]?.name ?? tm("assignedTeam")
      : teams?.length
        ? tm("managedTeams", { count: teams.length })
        : tm("noTeam");

  return (
    <DashboardShell
      role="manager"
      title={tp("reportsTitle")}
      subtitle={tp("reportsSubtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("managerRole"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: teamLabel
      }}
      actions={
        <Button href={teamIds.length ? exportHref : "#"} variant="ghost" size="sm" icon={<Download />} aria-disabled={!teamIds.length}>
          {tp("exportCsv")}
        </Button>
      }
      unreadNotifications={unreadNotifications}
    >
      <Panel>
        <form className="lp-filters-bar" method="get">
          <Field label={tp("dateFrom")} htmlFor="report-from">
            <Input id="report-from" type="date" name="from" defaultValue={range.from} />
          </Field>
          <Field label={tp("dateTo")} htmlFor="report-to">
            <Input id="report-to" type="date" name="to" defaultValue={range.to} />
          </Field>
          <Button type="submit">{tp("applyRange")}</Button>
          <Button href={`/${locale}/manager/reports`} variant="ghost">
            {tp("resetRange")}
          </Button>
        </form>
      </Panel>

      <Grid cols="three">
        <StatCard label={tp("recognitions")} value={rows.length} helper={tp("claimedByManagedTeams")} />
        <StatCard label={tp("recipients")} value={receiverCount} helper={tp("teamMembersRecognized")} />
        <StatCard label={tp("teamsEyebrow")} value={teamIds.length} helper={tp("insideYourScope")} />
      </Grid>

      <Panel
        title={tp("reportTitle")}
        description={tp("reportScopeCopy")}
        action={
          <Button href={teamIds.length ? exportHref : "#"} variant="ghost" size="sm" icon={<Download />} aria-disabled={!teamIds.length}>
            {tp("downloadCsv")}
          </Button>
        }
      >
        {!teamIds.length ? (
          <EmptyState eyebrow={tp("noManagedTeamEyebrow")} title={tp("noManagedTeamTitle")} copy={tp("noManagedTeamCopy")} />
        ) : rows.length ? (
          <Table className="lp-table-flat lp-table-stack">
            <thead>
              <tr>
                <th scope="col">{tp("tableDate")}</th>
                <th scope="col">{tp("receiver")}</th>
                <th scope="col">{tp("tableGiver")}</th>
                <th scope="col">{tp("tableCard")}</th>
                <th scope="col">{tp("category")}</th>
                <th scope="col">{tp("tableTeam")}</th>
                <th scope="col">{tp("tableNote")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-wide style={{ whiteSpace: "nowrap" }}>
                    {formatReportDate(row.recognitionDate, locale)}
                  </td>
                  <td data-label={tp("receiver")}>
                    <b style={{ fontWeight: 500 }}>{row.receiver}</b>
                  </td>
                  <td data-label={tp("tableGiver")}>{row.giver}</td>
                  <td data-label={tp("tableCard")}>{row.cardTitle}</td>
                  <td data-label={tp("category")}>{row.category}</td>
                  <td data-label={tp("tableTeam")}>{row.team}</td>
                  <td data-wide style={{ maxWidth: 280 }}>{row.personalNote || tc("noNote")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState eyebrow={tp("noRowsEyebrow")} title={tp("noRowsTitle")} copy={tp("noRowsCopy")} />
        )}
      </Panel>
    </DashboardShell>
  );
}
