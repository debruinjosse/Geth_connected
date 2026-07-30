import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { companyAdmin, companyReports } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { fetchRecognitionReportRows, formatReportDate, getRecognitionReportRange } from "@/lib/reports/recognition-report";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      <section className="dashboard-grid three">
        {companyReports.map((report) => (
          <article className="panel dashboard-panel" key={report.id}>
            <h2>{report.title}</h2>
            <p className="section-copy">{report.copy}</p>
            <a className="btn btn-secondary" href={`/${locale}/company`}>
              {t("openReport")}
            </a>
          </article>
        ))}
      </section>
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
    fetchRecognitionReportRows(supabase, { kind: "company", companyId: profile.company_id }, range),
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
        <a className="btn btn-secondary" href={exportHref}>
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
          <a className="btn btn-secondary" href={`/${locale}/company/reports`}>
            Reset
          </a>
        </form>
      </section>

      <section className="dashboard-grid three report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Recognitions</span>
          <strong>{rows.length}</strong>
          <p>claimed in this range</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{t("employeesTitle")}</span>
          <strong>{receiverCount}</strong>
          <p>recognized recipients</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{t("teamsTitle")}</span>
          <strong>{teamCount}</strong>
          <p>represented in the report</p>
        </article>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("companyReportTitle")}</h2>
            <p className="section-copy">Includes receiver, giver, card, category, team, and personal note.</p>
          </div>
          <a className="btn btn-secondary" href={exportHref}>
            <Download size={16} /> CSV
          </a>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="dashboard-table report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receiver</th>
                  <th>Giver</th>
                  <th>Card</th>
                  <th>Category</th>
                  <th>{t("team")}</th>
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
            title={t("noRowsTitle")}
            copy={t("noRowsCopy")}
          />
        )}
      </section>
    </DashboardShell>
  );
}
