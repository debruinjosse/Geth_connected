import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "companyPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const td = await getTranslations({ locale, namespace: "companyDashboard" });
  const returnTo = `/${locale}/company/settings`;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="company" title={t("settingsTitle")} subtitle={t("settingsSubtitle")} user={companyAdmin}>
        <CompanySettingsPanels
          labels={t}
          companyName={td("demoCompany")}
          industry={tc("demoFallback")}
          plan={tc("demoFallback")}
          status={tc("demoFallback")}
          adminEmail={companyAdmin.email}
        />
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
      <DashboardShell role="company" title={t("settingsTitle")} subtitle={t("settingsSubtitle")} user={companyAdmin}>
        <CompanySettingsPanels
          labels={t}
          companyName={td("demoCompany")}
          industry={tc("demoFallback")}
          plan={tc("demoFallback")}
          status={tc("demoFallback")}
          adminEmail={companyAdmin.email}
        />
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
    <DashboardShell
      role="company"
      title={t("settingsTitle")}
      subtitle={t("settingsSubtitle")}
      user={{
        name,
        initials: getInitials(profile.first_name, profile.last_name),
        team: company?.company_name ?? t("companyAdmin"),
        imageUrl: profile.profile_image
      }}
    >
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={profile.email ?? user.email ?? tc("noEmail")}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <CompanySettingsPanels
          labels={t}
          companyName={company?.company_name ?? tc("noCompany")}
          industry={company?.industry ?? tc("notSet")}
          plan={company?.subscription_plan ?? tc("notSet")}
          status={company?.status ?? tc("notSet")}
          adminEmail={profile.email}
        />
      </section>
    </DashboardShell>
  );
}

function CompanySettingsPanels({
  labels: t,
  companyName,
  industry,
  plan,
  status,
  adminEmail
}: {
  labels: Awaited<ReturnType<typeof getTranslations>>;
  companyName: string;
  industry: string;
  plan: string;
  status: string;
  adminEmail: string;
}) {
  return (
    <>
      <article className="panel dashboard-panel">
        <h2>{t("workspaceDetails")}</h2>
        <div className="profile-stack">
          <div><strong>{t("company")}</strong><p>{companyName}</p></div>
          <div><strong>{t("industry")}</strong><p>{industry}</p></div>
          <div><strong>{t("status")}</strong><p>{status}</p></div>
          <div><strong>{t("plan")}</strong><p>{plan}</p></div>
        </div>
      </article>
      <article className="panel dashboard-panel">
        <h2>{t("adminAccess")}</h2>
        <div className="profile-stack">
          <div><strong>{t("primaryAdmin")}</strong><p>{adminEmail}</p></div>
          <div><strong>{t("teamManagement")}</strong><p>{t("teamManagementCopy")}</p></div>
          <div><strong>{t("billing")}</strong><p>{t("billingCopy")}</p></div>
        </div>
      </article>
    </>
  );
}
