import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { currentUser, employeeTopQualities } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
        <section className="dashboard-grid two">
          <ProfilePanels labels={panelLabels} name={currentUser.name} email={currentUser.email} team={currentUser.team} company={t("demoCompany")} role={t("demoRole")} status={t("demoStatus")} />
        </section>
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
        <section className="dashboard-grid two">
          <ProfilePanels labels={panelLabels} name={currentUser.name} email={currentUser.email} team={currentUser.team} company={t("demoCompany")} role={t("demoRole")} status={t("demoStatus")} />
        </section>
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
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={profile.email ?? user.email ?? tc("noEmail")}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <ProfilePanels labels={panelLabels} name={name} email={profile.email ?? user.email ?? tc("noEmail")} team={team?.name ?? tc("unassigned")} company={company?.company_name ?? tc("noCompany")} role={(profile.role ?? "employee").replace("_", " ")} status={profile.status ?? "active"} />
      </section>
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
  status
}: {
  labels: ProfilePanelLabels;
  name: string;
  email: string;
  team: string;
  company: string;
  role: string;
  status: string;
}) {
  return (
    <>
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <h2>{labels.details}</h2>
        </div>
        <div className="profile-stack">
          <div><strong>{labels.name}</strong><p>{name}</p></div>
          <div><strong>{labels.email}</strong><p>{email}</p></div>
          <div><strong>{labels.company}</strong><p>{company}</p></div>
          <div><strong>{labels.team}</strong><p>{team}</p></div>
          <div><strong>{labels.role}</strong><p>{role}</p></div>
          <div><strong>{labels.status}</strong><p>{status}</p></div>
        </div>
      </article>
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <h2>{labels.strengths}</h2>
        </div>
        <div className="quality-pills">
          {employeeTopQualities.map((quality) => (
            <span className="quality-pill" key={quality.label} style={{ color: quality.tone }}>
              {quality.label}
            </span>
          ))}
        </div>
      </article>
    </>
  );
}
