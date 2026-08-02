import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Activity, Settings, UsersRound } from "lucide-react";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { managerUser } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

export default async function ManagerSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [{ settings }, locale] = await Promise.all([searchParams, getLocale()]);
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "manager" });
  const managerBase = `/${locale}/manager`;
  const returnTo = `${managerBase}/settings`;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title={tp("settingsTitle")} subtitle={tp("settingsSubtitleDemo")} user={managerUser}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>{tp("signalPreferences")}</h2></div>
            <EmptyState title={tp("demoModeTitle")} copy={tp("demoModeCopy")} />
          </article>
          <article className="panel dashboard-panel manager-action-panel">
            <Link className="manager-action-card" href={`${managerBase}/team`}><UsersRound size={18} /> {tp("openTeamMembers")}</Link>
            <Link className="manager-action-card" href={`${managerBase}/signals`}><Activity size={18} /> {tp("reviewSignals")}</Link>
          </article>
        </section>
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login?next=${encodeURIComponent(returnTo)}`);

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id, tm, locale);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect(`/auth/repair-profile?next=${encodeURIComponent(returnTo)}`);
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);
  const managerName = `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || tc("managerRole");

  return (
    <DashboardShell
      role="manager"
      title={tp("settingsTitle")}
      subtitle={tp("settingsSubtitle")}
      user={{
        name: managerName,
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel,
        imageUrl: insights.profile.profile_image
      }}
      actions={<span className="quality-pill">{tp("liveProfile")}</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={user.email ?? tc("noEmailOnSession")}
          firstName={insights.profile.first_name ?? ""}
          lastName={insights.profile.last_name ?? ""}
          profileImageUrl={insights.profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{tp("managerProfile")}</h2>
              <p>{tp("managerProfileCopy")}</p>
            </div>
          </div>
          <div className="profile-stack">
            <div><strong>{tp("name")}</strong><p>{managerName}</p></div>
            <div><strong>{tp("email")}</strong><p>{user.email ?? tp("noEmailOnSession")}</p></div>
            <div><strong>{tp("managedScope")}</strong><p>{insights.teamLabel}</p></div>
            <div><strong>{tp("managedTeams")}</strong><p>{insights.teamIds.length}</p></div>
            <div><strong>{tp("teamRecognitions")}</strong><p>{insights.recognitionCount}</p></div>
          </div>
        </article>

        <article className="panel dashboard-panel manager-action-panel">
          <div className="panel-top">
            <div>
              <h2>{tp("quickActions")}</h2>
              <p>{tp("quickActionsCopy")}</p>
            </div>
          </div>
          <Link className="manager-action-card" href={`${managerBase}/team`}><UsersRound size={18} /> {tp("openTeamMembers")}</Link>
          <Link className="manager-action-card" href={`${managerBase}/signals`}><Activity size={18} /> {tp("reviewSignals")}</Link>
          <Link className="manager-action-card" href={`${managerBase}/analytics`}><Settings size={18} /> {tp("reviewAnalytics")}</Link>
        </article>
      </section>
    </DashboardShell>
  );
}
