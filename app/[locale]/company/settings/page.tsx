import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { companyAdmin } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "CA";
}

export default async function CompanySettingsPage({
  searchParams
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [{ settings }, locale] = await Promise.all([searchParams, getLocale()]);
  const returnTo = `/${locale}/company/settings`;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="company" title="Settings" subtitle="Workspace identity and Phase 1 configuration." user={companyAdmin}>
        <CompanySettingsPanels companyName="ABC Company" industry="Demo workspace" plan="Growth" status="Demo" adminEmail={companyAdmin.email} />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <DashboardShell role="company" title="Settings" subtitle="Workspace identity and Phase 1 configuration." user={companyAdmin}>
        <CompanySettingsPanels companyName="ABC Company" industry="Demo workspace" plan="Growth" status="Demo" adminEmail={companyAdmin.email} />
      </DashboardShell>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, profile_image, company:companies(company_name, industry, subscription_plan, status)")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string;
      last_name: string;
      email: string;
      profile_image: string | null;
      company: { company_name: string; industry: string | null; subscription_plan: string | null; status: string } | Array<{ company_name: string; industry: string | null; subscription_plan: string | null; status: string }> | null;
    }>();

  if (error || !profile) redirect("/auth/repair-profile");

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  const name = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <DashboardShell role="company" title="Settings" subtitle="Workspace identity and Phase 1 configuration." user={{ name, initials: getInitials(profile.first_name, profile.last_name), team: company?.company_name ?? "Company admin", imageUrl: profile.profile_image }}>
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={profile.email ?? user.email ?? "No email"}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <CompanySettingsPanels companyName={company?.company_name ?? "No company"} industry={company?.industry ?? "Not set"} plan={company?.subscription_plan ?? "Not set"} status={company?.status ?? "Unknown"} adminEmail={profile.email} />
      </section>
    </DashboardShell>
  );
}

function CompanySettingsPanels({
  companyName,
  industry,
  plan,
  status,
  adminEmail
}: {
  companyName: string;
  industry: string;
  plan: string;
  status: string;
  adminEmail: string;
}) {
  return (
    <>
      <article className="panel dashboard-panel">
        <h2>Workspace details</h2>
        <div className="profile-stack">
          <div><strong>Company</strong><p>{companyName}</p></div>
          <div><strong>Industry</strong><p>{industry}</p></div>
          <div><strong>Status</strong><p>{status}</p></div>
          <div><strong>Plan</strong><p>{plan}</p></div>
        </div>
      </article>
      <article className="panel dashboard-panel">
        <h2>Admin access</h2>
        <div className="profile-stack">
          <div><strong>Primary admin</strong><p>{adminEmail}</p></div>
          <div><strong>Team management</strong><p>Create teams, assign managers, and invite employees from the company workspace.</p></div>
          <div><strong>Billing</strong><p>Billing remains a Phase 2 integration.</p></div>
        </div>
      </article>
    </>
  );
}
