import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Building2, CreditCard, Shield, Star, UserRound, UsersRound } from "lucide-react";
import { createCompanyInviteFromAdminAction, updateCompanyStatusAction } from "@/app/actions/adminControls";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminProfile = {
  first_name: string | null;
  last_name: string | null;
  role: string;
};

type Company = {
  id: string;
  company_name: string;
  slug: string | null;
  industry: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  status: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  status: string | null;
  team_id: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  manager_id: string | null;
};

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
};

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "SA";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function getName(profile: ProfileRow) {
  return `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.email || "GETH user";
}

export default async function AdminCompanyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const [{ companyId }, { invite }, locale] = await Promise.all([params, searchParams, getLocale()]);
  const returnTo = `/${locale}/admin/companies/${companyId}`;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/admin/companies");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<AdminProfile>();

  if (adminError || !adminProfile || !["platform_admin", "super_admin"].includes(adminProfile.role)) {
    redirect("/auth/repair-profile?next=/admin");
  }

  const [
    { data: company, error: companyError },
    { data: profiles, error: profilesError },
    { data: teams, error: teamsError },
    { data: invitations, error: invitationsError },
    { count: recognitionCount },
    unreadNotifications
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, slug, industry, subscription_plan, subscription_status, status, created_at")
      .eq("id", companyId)
      .maybeSingle<Company>(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, status, team_id")
      .eq("company_id", companyId)
      .order("role")
      .order("first_name"),
    supabase.from("teams").select("id, name, manager_id").eq("company_id", companyId).order("name"),
    supabase.from("invitations").select("id, email, role, status, token, expires_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(8),
    supabase.from("recognition_events").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companyError) {
    notFound();
  }

  if (!company) {
    notFound();
  }

  if (profilesError || teamsError || invitationsError) {
    throw new Error("Failed to load company control data.");
  }

  const companyProfiles = (profiles ?? []) as ProfileRow[];
  const companyTeams = (teams ?? []) as TeamRow[];
  const pendingInvitations = ((invitations ?? []) as InvitationRow[]).filter((invite) => invite.status === "pending");
  const companyAdmins = companyProfiles.filter((profile) => profile.role === "company_admin");
  const managers = companyProfiles.filter((profile) => profile.role === "manager");
  const employees = companyProfiles.filter((profile) => profile.role === "employee");
  const teamMap = new Map(companyTeams.map((team) => [team.id, team.name]));
  const managerMap = new Map(companyProfiles.map((profile) => [profile.id, getName(profile)]));

  return (
    <DashboardShell
      role="admin"
      title={company.company_name}
      subtitle="Company workspace controls, hierarchy, teams, and platform-level status."
      user={{
        name: `${adminProfile.first_name ?? ""} ${adminProfile.last_name ?? ""}`.trim() || "GETH Admin",
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: "GETH Platform"
      }}
      actions={<Link className="btn btn-secondary" href="/admin/companies">Back to companies</Link>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Shield />} value={companyAdmins.length} label="Company admins" helper="Workspace owners" />
        <MetricCard icon={<UsersRound />} value={managers.length} label="Managers" helper="Team leads" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<UserRound />} value={employees.length} label="Employees" helper="Recognized users" />
        <MetricCard icon={<Star />} value={recognitionCount ?? 0} label="Recognitions" helper="Company total" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Workspace status</h2>
              <p className="section-copy">Super admins can pause or reactivate a company here.</p>
            </div>
          </div>
          <div className="profile-stack">
            <div><strong>Industry</strong><p>{company.industry ?? "Not set"}</p></div>
            <div><strong>Slug</strong><p>{company.slug ?? "Not set"}</p></div>
            <div><strong>Plan</strong><p>{company.subscription_plan ?? "Starter"}</p></div>
            <div><strong>Billing status</strong><p>{company.subscription_status ?? "not_configured"}</p></div>
            <div><strong>Created</strong><p>{formatDate(company.created_at)}</p></div>
          </div>
          <form action={updateCompanyStatusAction} className="admin-control-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="companyId" value={company.id} />
            <label className="sr-only" htmlFor="company-status">Company status</label>
            <select id="company-status" name="status" defaultValue={company.status ?? "active"} aria-label={`Update ${company.company_name} status`}>
              <option value="active">Active</option>
              <option value="demo">Demo</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn btn-secondary compact" type="submit">Save status</button>
          </form>
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Hierarchy</h2>
              <p className="section-copy">Platform → company → admins/managers/employees.</p>
            </div>
          </div>
          <div className="signal-list">
            <div className="signal-card">
              <Building2 size={18} />
              <div><strong>GETH Platform</strong><p>Super admin controls companies and subscriptions.</p></div>
            </div>
            <div className="signal-card">
              <Shield size={18} />
              <div><strong>{company.company_name}</strong><p>{companyAdmins.length} admin{companyAdmins.length === 1 ? "" : "s"} manage this workspace.</p></div>
            </div>
            <div className="signal-card">
              <UsersRound size={18} />
              <div><strong>{companyTeams.length} team{companyTeams.length === 1 ? "" : "s"}</strong><p>{managers.length} manager{managers.length === 1 ? "" : "s"} and {employees.length} employee{employees.length === 1 ? "" : "s"}.</p></div>
            </div>
          </div>
          <form action={createCompanyInviteFromAdminAction} className="admin-invite-form">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div>
              <h3>Send an invite to this company</h3>
              <p className="section-copy">Create a role-specific onboarding link for this workspace.</p>
            </div>
            {invite ? (
              <p className={`settings-feedback ${invite === "created" ? "success" : "error"}`}>
                {invite === "created" ? "Invite created and email sent if SMTP is configured." : "Invite created, but email may need to be copied from pending invitations."}
              </p>
            ) : null}
            <label>
              Work email
              <input className="input" type="email" name="email" placeholder="new.user@company.com" required />
            </label>
            <label>
              Role
              <select className="input" name="role" defaultValue="employee">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="company_admin">Company admin</option>
              </select>
            </label>
            <button className="btn btn-primary compact" type="submit">Send invite</button>
          </form>
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Teams</h2>
              <p className="section-copy">Manager ownership for this company.</p>
            </div>
          </div>
          {companyTeams.length ? (
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead><tr><th>Team</th><th>Manager</th></tr></thead>
                <tbody>
                  {companyTeams.map((team) => (
                    <tr key={team.id}>
                      <td><strong>{team.name}</strong></td>
                      <td>{team.manager_id ? managerMap.get(team.manager_id) ?? "Assigned manager" : "Unassigned"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No teams yet" copy="Company admins can create teams from their company portal." />
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Pending invitations</h2>
              <p className="section-copy">Open onboarding links for this company. Copy these links for company registration.</p>
            </div>
          </div>
          {pendingInvitations.length ? (
            <div className="signal-list">
              {pendingInvitations.map((invite) => (
                <div className="signal-card" key={invite.id}>
                  <div>
                    <strong>{invite.email}</strong>
                    <p>{invite.role.replace("_", " ")} invite expires {formatDate(invite.expires_at)}.</p>
                    <Link className="panel-link" href={`/invite/${invite.token}`}>Open registration link</Link>
                  </div>
                  <span className="quality-pill">{invite.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No pending invites" copy="Pending employee and manager invites will appear here." />
          )}
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>People</h2>
            <p className="section-copy">Company admins, managers, and employees in this workspace.</p>
          </div>
        </div>
        {companyProfiles.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th><th>Status</th></tr></thead>
              <tbody>
                {companyProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td><strong>{getName(profile)}</strong></td>
                    <td>{profile.email ?? "No email"}</td>
                    <td>{profile.role.replace("_", " ")}</td>
                    <td>{profile.team_id ? teamMap.get(profile.team_id) ?? "Assigned team" : "Unassigned"}</td>
                    <td><span className="admin-status-pill">{profile.status ?? "active"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No profiles yet" copy="Users will appear here after signup, seed, or invitation acceptance." />
        )}
      </article>
    </DashboardShell>
  );
}
