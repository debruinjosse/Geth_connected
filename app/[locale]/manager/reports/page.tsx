import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { managerUser } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { fetchRecognitionReportRows, formatReportDate, getRecognitionReportRange } from "@/lib/reports/recognition-report";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      <section className="dashboard-grid three">
        {[
          [tp("demoQuarterlyTitle"), tp("demoQuarterlyCopy")],
          [tp("demoOneToOneTitle"), tp("demoOneToOneCopy")],
          [tp("demoPulseTitle"), tp("demoPulseCopy")]
        ].map(([title, copy]) => (
          <article className="panel dashboard-panel" key={title}>
            <h2>{title}</h2>
            <p className="section-copy">{copy}</p>
            <a className="btn btn-secondary" href="/manager">
              {tp("openReport")}
            </a>
          </article>
        ))}
      </section>
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
        <a className={`btn btn-secondary ${teamIds.length ? "" : "disabled-link"}`.trim()} href={teamIds.length ? exportHref : "#"} aria-disabled={!teamIds.length}>
          <Download size={16} /> {tp("exportCsv")}
        </a>
      }
      unreadNotifications={unreadNotifications}
    >
      <section className="panel dashboard-panel report-controls-panel">
        <form className="report-filter-form" method="get">
          <label>
            <span>{tp("dateFrom")}</span>
            <input type="date" name="from" defaultValue={range.from} />
          </label>
          <label>
            <span>{tp("dateTo")}</span>
            <input type="date" name="to" defaultValue={range.to} />
          </label>
          <button className="btn btn-primary" type="submit">
            {tp("applyRange")}
          </button>
          <a className="btn btn-secondary" href={`/${locale}/manager/reports`}>
            {tp("resetRange")}
          </a>
        </form>
      </section>

      <section className="dashboard-grid three report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{tp("recognitions")}</span>
          <strong>{rows.length}</strong>
          <p>{tp("claimedByManagedTeams")}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{tp("recipients")}</span>
          <strong>{receiverCount}</strong>
          <p>{tp("teamMembersRecognized")}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{tp("teamsEyebrow")}</span>
          <strong>{teamIds.length}</strong>
          <p>{tp("insideYourScope")}</p>
        </article>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{tp("reportTitle")}</h2>
            <p className="section-copy">{tp("reportScopeCopy")}</p>
          </div>
          <a className={`btn btn-secondary ${teamIds.length ? "" : "disabled-link"}`.trim()} href={teamIds.length ? exportHref : "#"} aria-disabled={!teamIds.length}>
            <Download size={16} /> {tp("downloadCsv")}
          </a>
        </div>
        {!teamIds.length ? (
          <EmptyState
            eyebrow={tp("noManagedTeamEyebrow")}
            title={tp("noManagedTeamTitle")}
            copy={tp("noManagedTeamCopy")}
          />
        ) : rows.length ? (
          <div className="table-wrap">
            <table className="dashboard-table report-table">
              <thead>
                <tr>
                  <th>{tp("tableDate")}</th>
                  <th>{tp("receiver")}</th>
                  <th>{tp("tableGiver")}</th>
                  <th>{tp("tableCard")}</th>
                  <th>{tp("category")}</th>
                  <th>{tp("tableTeam")}</th>
                  <th>{tp("tableNote")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatReportDate(row.recognitionDate, locale)}</td>
                    <td><strong>{row.receiver}</strong></td>
                    <td>{row.giver}</td>
                    <td>{row.cardTitle}</td>
                    <td>{row.category}</td>
                    <td>{row.team}</td>
                    <td className="report-note">{row.personalNote || tc("noNote")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            eyebrow={tp("noRowsEyebrow")}
            title={tp("noRowsTitle")}
            copy={tp("noRowsCopy")}
          />
        )}
      </section>
    </DashboardShell>
  );
}
