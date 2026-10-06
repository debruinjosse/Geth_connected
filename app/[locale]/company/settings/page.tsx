import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { companyAdmin } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";

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
      <Grid cols="two">
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
      </Grid>
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
    <div className="lp-stack">
      <Panel title={t("workspaceDetails")}>
        <dl className="lp-defs">
          <div><dt>{t("company")}</dt><dd>{companyName}</dd></div>
          <div><dt>{t("industry")}</dt><dd>{industry}</dd></div>
          <div><dt>{t("status")}</dt><dd style={{ textTransform: "capitalize" }}>{status}</dd></div>
          <div><dt>{t("plan")}</dt><dd style={{ textTransform: "capitalize" }}>{plan}</dd></div>
        </dl>
      </Panel>
      <Panel title={t("adminAccess")}>
        <dl className="lp-defs lp-defs-one">
          <div><dt>{t("primaryAdmin")}</dt><dd>{adminEmail}</dd></div>
          <div><dt>{t("teamManagement")}</dt><dd>{t("teamManagementCopy")}</dd></div>
          <div><dt>{t("billing")}</dt><dd>{t("billingCopy")}</dd></div>
        </dl>
      </Panel>
    </div>
  );
}
