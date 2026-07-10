import { Download } from "lucide-react";
import { redirect } from "next/navigation";
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

function renderDemoReports() {
  return (
    <DashboardShell role="manager" title="Reports" subtitle="Export-ready views for team rituals, reviews, and quarterly conversations." user={managerUser}>
      <section className="dashboard-grid three">
        {[
          ["Quarterly team report", "Recognition density, active members, and signal changes."],
          ["One-to-one prep", "A concise summary of recognition notes for each direct report."],
          ["Culture pulse", "A manager-friendly snapshot of engagement and celebration rhythm."]
        ].map(([title, copy]) => (
          <article className="panel dashboard-panel" key={title}>
            <h2>{title}</h2>
            <p className="section-copy">{copy}</p>
            <a className="btn btn-secondary" href="/manager">
              Open report
            </a>
          </article>
        ))}
      </section>
    </DashboardShell>
  );
}

export default async function ManagerReportsPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!hasSupabaseServerConfig()) {
    return renderDemoReports();
  }

  const params = await searchParams;
  const range = getRecognitionReportRange(params);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoReports();
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
    redirect("/manager");
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("manager_id", user.id)
    .order("name");

  if (teamsError) {
    throw new Error("Failed to load managed teams for reports.");
  }

  const teamIds = (teams ?? []).map((team) => team.id);
  const [rows, unreadNotifications] = await Promise.all([
    fetchRecognitionReportRows(supabase, { kind: "teams", companyId: profile.company_id, teamIds }, range),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  const exportHref = `/manager/reports/export?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
  const receiverCount = new Set(rows.map((row) => row.receiver)).size;
  const teamLabel = teams?.length === 1 ? teams[0]?.name ?? "Managed team" : teams?.length ? `${teams.length} managed teams` : "No team assigned";

  return (
    <DashboardShell
      role="manager"
      title="Reports"
      subtitle="Team-scoped recognition exports for one-to-ones, rituals, and quarterly reviews."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Manager",
        initials: getInitials(profile.first_name, profile.last_name),
        team: teamLabel
      }}
      actions={
        <a className={`btn btn-secondary ${teamIds.length ? "" : "disabled-link"}`.trim()} href={teamIds.length ? exportHref : "#"} aria-disabled={!teamIds.length}>
          <Download size={16} /> Export CSV
        </a>
      }
      unreadNotifications={unreadNotifications}
    >
      <section className="panel dashboard-panel report-controls-panel">
        <form className="report-filter-form" method="get">
          <label>
            <span>From</span>
            <input type="date" name="from" defaultValue={range.from} />
          </label>
          <label>
            <span>To</span>
            <input type="date" name="to" defaultValue={range.to} />
          </label>
          <button className="btn btn-primary" type="submit">
            Apply range
          </button>
          <a className="btn btn-secondary" href="/manager/reports">
            Reset
          </a>
        </form>
      </section>

      <section className="dashboard-grid three report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Recognitions</span>
          <strong>{rows.length}</strong>
          <p>claimed by managed teams</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Recipients</span>
          <strong>{receiverCount}</strong>
          <p>team members recognized</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Teams</span>
          <strong>{teamIds.length}</strong>
          <p>inside your scope</p>
        </article>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Team recognition report</h2>
            <p className="section-copy">Only recognitions from teams assigned to you are included.</p>
          </div>
          <a className={`btn btn-secondary ${teamIds.length ? "" : "disabled-link"}`.trim()} href={teamIds.length ? exportHref : "#"} aria-disabled={!teamIds.length}>
            <Download size={16} /> CSV
          </a>
        </div>
        {!teamIds.length ? (
          <EmptyState
            eyebrow="No managed team"
            title="Assign a team before exporting"
            copy="Company admins can assign you as a manager for one or more teams. Your report will populate after that."
          />
        ) : rows.length ? (
          <div className="table-wrap">
            <table className="dashboard-table report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receiver</th>
                  <th>Giver</th>
                  <th>Card</th>
                  <th>Category</th>
                  <th>Team</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatReportDate(row.recognitionDate)}</td>
                    <td><strong>{row.receiver}</strong></td>
                    <td>{row.giver}</td>
                    <td>{row.cardTitle}</td>
                    <td>{row.category}</td>
                    <td>{row.team}</td>
                    <td className="report-note">{row.personalNote || "No note"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            eyebrow="No report rows"
            title="No recognitions in this date range"
            copy="Try a wider range or wait for employees in your teams to claim GETH cards."
          />
        )}
      </section>
    </DashboardShell>
  );
}
