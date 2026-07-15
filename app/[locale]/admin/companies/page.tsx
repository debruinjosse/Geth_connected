import { redirect } from "next/navigation";
import Link from "next/link";
import { createCompanyWorkspaceAction, updateCompanyStatusAction } from "@/app/actions/adminControls";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

export default async function AdminCompaniesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title="Companies" subtitle="Connect Supabase to review company environments." user={superAdminUser}>
        <EmptyState title="Supabase not configured" copy="Company data will appear here after environment variables are configured." />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const [{ data: companies, error: companiesError }, { data: profiles, error: profilesError }, { data: teams, error: teamsError }] = await Promise.all([
    supabase.from("companies").select("id, company_name, subscription_plan, status, industry, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, company_id, role"),
    supabase.from("teams").select("id, company_id")
  ]);

  if (companiesError || profilesError || teamsError) {
    throw new Error("Failed to load platform company data.");
  }

  const profileCounts = new Map<string, number>();
  const managerCounts = new Map<string, number>();
  const teamCounts = new Map<string, number>();

  for (const item of profiles ?? []) {
    if (!item.company_id) continue;
    profileCounts.set(item.company_id, (profileCounts.get(item.company_id) ?? 0) + 1);
    if (item.role === "manager") {
      managerCounts.set(item.company_id, (managerCounts.get(item.company_id) ?? 0) + 1);
    }
  }

  for (const team of teams ?? []) {
    teamCounts.set(team.company_id, (teamCounts.get(team.company_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="admin"
      title="Companies"
      subtitle="Activate, pause, and review company environments across the platform."
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: "GETH Platform"
      }}
      actions={<span className="quality-pill">Live data</span>}
    >
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Create company workspace</h2>
            <p className="section-copy">Create a company, invite its first company admin, and optionally invite a starter manager.</p>
          </div>
        </div>
        <form action={createCompanyWorkspaceAction} className="form-grid admin-company-create-form">
          <div className="form-field">
            <label htmlFor="companyName">Company name</label>
            <input id="companyName" className="input" name="companyName" placeholder="ABC Company" required />
          </div>
          <div className="form-field">
            <label htmlFor="slug">Company slug</label>
            <input id="slug" className="input" name="slug" placeholder="abc-company" />
          </div>
          <div className="form-field">
            <label htmlFor="industry">Industry</label>
            <input id="industry" className="input" name="industry" placeholder="Technology, healthcare, education..." />
          </div>
          <div className="form-field">
            <label htmlFor="subscriptionPlan">Plan</label>
            <select id="subscriptionPlan" className="input" name="subscriptionPlan" defaultValue="starter">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="companyAdminEmail">First company admin email</label>
            <input id="companyAdminEmail" className="input" name="companyAdminEmail" type="email" placeholder="admin@company.com" required />
          </div>
          <div className="form-field">
            <label htmlFor="teamName">Starter team</label>
            <input id="teamName" className="input" name="teamName" placeholder="Marketing Team" />
          </div>
          <div className="form-field">
            <label htmlFor="managerEmail">Starter manager email</label>
            <input id="managerEmail" className="input" name="managerEmail" type="email" placeholder="manager@company.com" />
          </div>
          <div className="form-field admin-company-create-submit">
            <span className="field-help">The invite links appear on the company hierarchy page after creation.</span>
            <button className="btn btn-dark" type="submit">Create company and invites</button>
          </div>
        </form>
      </article>

      <article className="panel dashboard-panel">
        <div className="table-wrap">
          {companies?.length ? (
            <table className="dashboard-table">
              <thead><tr><th>Company</th><th>Plan</th><th>Status</th><th>Users</th><th>Managers</th><th>Teams</th><th>Control</th></tr></thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <strong>{company.company_name}</strong>
                      <p style={{ margin: "4px 0 0", color: "var(--theme-muted)" }}>{company.industry ?? "No industry set"}</p>
                      <Link className="panel-link" href={`/admin/companies/${company.id}`}>Open hierarchy</Link>
                    </td>
                    <td>{company.subscription_plan}</td>
                    <td><span className="admin-status-pill">{company.status}</span></td>
                    <td>{profileCounts.get(company.id) ?? 0}</td>
                    <td>{managerCounts.get(company.id) ?? 0}</td>
                    <td>{teamCounts.get(company.id) ?? 0}</td>
                    <td>
                      <form action={updateCompanyStatusAction} className="admin-control-form">
                        <input type="hidden" name="companyId" value={company.id} />
                        <label className="sr-only" htmlFor={`status-${company.id}`}>Company status</label>
                        <select id={`status-${company.id}`} name="status" defaultValue={company.status} aria-label={`Update ${company.company_name} status`}>
                          <option value="active">Active</option>
                          <option value="demo">Demo</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <button className="btn btn-secondary compact" type="submit">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No companies yet" copy="Company admin signups and seeded workspaces will appear here." />
          )}
        </div>
      </article>
    </DashboardShell>
  );
}
