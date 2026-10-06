import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { localizeDemoTopQualities } from "@/lib/localize-demo-content";
import { currentUser, employeeTopQualities } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CSSProperties } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "EM";
}

export default async function EmployeeProfilePage({
  searchParams
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [{ settings }, locale] = await Promise.all([searchParams, getLocale()]);
  const returnTo = `/${locale}/employee/profile`;
  const t = await getTranslations({ locale, namespace: "employeePages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const panelLabels = {
    details: t("profileDetails"),
    name: t("name"),
    email: t("email"),
    company: t("company"),
    team: t("team"),
    role: t("role"),
    status: t("status"),
    strengths: t("recognizedStrengths")
  };

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title={t("profileTitle")} subtitle={t("profileSubtitle")} user={currentUser}>
        <Grid cols="two">
          <ProfilePanels labels={panelLabels} name={currentUser.name} email={currentUser.email} team={currentUser.team} company={t("demoCompany")} role={t("demoRole")} status={t("demoStatus")} qualities={localizeDemoTopQualities(employeeTopQualities, locale)} />
        </Grid>
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
      <DashboardShell role="employee" title={t("profileTitle")} subtitle={t("profileSubtitle")} user={currentUser}>
        <Grid cols="two">
          <ProfilePanels labels={panelLabels} name={currentUser.name} email={currentUser.email} team={currentUser.team} company={t("demoCompany")} role={t("demoRole")} status={t("demoStatus")} qualities={localizeDemoTopQualities(employeeTopQualities, locale)} />
        </Grid>
      </DashboardShell>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, role, status, company_id, team_id, profile_image")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      role: string | null;
      status: string | null;
      company_id: string | null;
      team_id: string | null;
      profile_image: string | null;
    }>();

  if (error || !profile) redirect("/auth/repair-profile");

  const [{ data: company }, { data: team }] = await Promise.all([
    profile.company_id
      ? supabase.from("companies").select("company_name").eq("id", profile.company_id).maybeSingle<{ company_name: string }>()
      : Promise.resolve({ data: null }),
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null })
  ]);
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("gethUser");

  return (
    <DashboardShell
      role="employee"
      title={t("profileTitle")}
      subtitle={t("profileSubtitle")}
      user={{ name, initials: getInitials(profile.first_name, profile.last_name), team: team?.name ?? company?.company_name ?? "GETH", imageUrl: profile.profile_image }}
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
        <ProfilePanels labels={panelLabels} name={name} email={profile.email ?? user.email ?? tc("noEmail")} team={team?.name ?? tc("unassigned")} company={company?.company_name ?? tc("noCompany")} role={(profile.role ?? "employee").replace("_", " ")} status={profile.status ?? "active"} />
      </Grid>
    </DashboardShell>
  );
}

type ProfilePanelLabels = {
  details: string;
  name: string;
  email: string;
  company: string;
  team: string;
  role: string;
  status: string;
  strengths: string;
};

function ProfilePanels({
  labels,
  name,
  email,
  team,
  company,
  role,
  status,
  qualities = employeeTopQualities
}: {
  labels: ProfilePanelLabels;
  name: string;
  email: string;
  team: string;
  company: string;
  role: string;
  status: string;
  qualities?: Array<{ label: string; tone: string; count: number }>;
}) {
  return (
    <div className="lp-stack">
      <Panel title={labels.details}>
        <div className="lp-profile-head">
          <Avatar size="lg" name={name} />
          <div>
            <b style={{ fontWeight: 500, fontSize: "1.15rem" }}>{name}</b>
            <p className="lp-hint" style={{ fontSize: 14.5 }}>{email}</p>
          </div>
        </div>
        <dl className="lp-defs">
          <div><dt>{labels.company}</dt><dd>{company}</dd></div>
          <div><dt>{labels.team}</dt><dd>{team}</dd></div>
          <div><dt>{labels.role}</dt><dd style={{ textTransform: "capitalize" }}>{role}</dd></div>
          <div><dt>{labels.status}</dt><dd style={{ textTransform: "capitalize" }}>{status}</dd></div>
        </dl>
      </Panel>
      <Panel title={labels.strengths}>
        <div className="lp-chips" style={{ marginTop: 0 }}>
          {qualities.map((quality) => (
            <span className="lp-chip-q" key={quality.label} style={{ "--c": quality.tone } as CSSProperties}>
              {quality.label}
              <small>{quality.count}</small>
            </span>
          ))}
        </div>
      </Panel>
    </div>
  );
}
