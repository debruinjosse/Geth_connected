import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Activity, Settings, UsersRound, ArrowRight } from "lucide-react";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { managerUser } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

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
        <Grid cols="two">
          <Panel title={tp("signalPreferences")}>
            <EmptyState title={tp("demoModeTitle")} copy={tp("demoModeCopy")} />
          </Panel>
          <Panel>
            <div className="lp-actions-list">
              <Link className="lp-role" href={`${managerBase}/team`}><span><UsersRound size={18} /> {tp("openTeamMembers")}</span><ArrowRight aria-hidden="true" /></Link>
              <Link className="lp-role" href={`${managerBase}/signals`}><span><Activity size={18} /> {tp("reviewSignals")}</span><ArrowRight aria-hidden="true" /></Link>
            </div>
          </Panel>
        </Grid>
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
      actions={<Pill tone="green">{tp("liveProfile")}</Pill>}
      unreadNotifications={unreadNotifications}
    >
      <Grid cols="two">
        <AccountSettingsPanel
          email={user.email ?? tc("noEmailOnSession")}
          firstName={insights.profile.first_name ?? ""}
          lastName={insights.profile.last_name ?? ""}
          profileImageUrl={insights.profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <div className="lp-stack">
          <Panel title={tp("managerProfile")} description={tp("managerProfileCopy")}>
            <div className="lp-profile-head">
              <Avatar size="lg" name={managerName} imageUrl={insights.profile.profile_image} />
              <div>
                <b style={{ fontWeight: 500, fontSize: "1.15rem" }}>{managerName}</b>
                <p className="lp-hint" style={{ fontSize: 14.5 }}>{user.email ?? tp("noEmailOnSession")}</p>
              </div>
            </div>
            <dl className="lp-defs">
              <div><dt>{tp("managedScope")}</dt><dd>{insights.teamLabel}</dd></div>
              <div><dt>{tp("managedTeams")}</dt><dd>{insights.teamIds.length}</dd></div>
              <div><dt>{tp("teamRecognitions")}</dt><dd>{insights.recognitionCount}</dd></div>
            </dl>
          </Panel>

          <Panel title={tp("quickActions")} description={tp("quickActionsCopy")}>
            <div className="lp-actions-list">
              <Link className="lp-role" href={`${managerBase}/team`}><span><UsersRound size={18} /> {tp("openTeamMembers")}</span><ArrowRight aria-hidden="true" /></Link>
              <Link className="lp-role" href={`${managerBase}/signals`}><span><Activity size={18} /> {tp("reviewSignals")}</span><ArrowRight aria-hidden="true" /></Link>
              <Link className="lp-role" href={`${managerBase}/analytics`}><span><Settings size={18} /> {tp("reviewAnalytics")}</span><ArrowRight aria-hidden="true" /></Link>
            </div>
          </Panel>
        </div>
      </Grid>
    </DashboardShell>
  );
}
