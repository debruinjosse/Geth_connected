import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sendManagerNoteAction } from "@/app/actions/managerNotes";
import { localizedLoginPath } from "@/lib/auth/paths";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { TeamTable } from "@/components/TeamTable";
import { localizeDemoPeople } from "@/lib/localize-demo-content";
import { managerUser, people } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

export default async function ManagerTeamPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ note?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "manager" });

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title={tp("teamTitle")} subtitle={tp("teamSubtitle")} user={managerUser} actions={<span className="quality-pill">{tc("demoFallback")}</span>}>
        <article className="panel dashboard-panel"><TeamTable people={localizeDemoPeople(people, locale)} /></article>
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect(localizedLoginPath(locale, `/${locale}/manager/team`));

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id, tm, locale);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect("/auth/repair-profile");
    console.error("manager team insights failed", error);
    return (
      <DashboardShell
        role="manager"
        title={tp("teamTitle")}
        subtitle={tp("teamSubtitle")}
        user={{
          name: tc("managerRole"),
          initials: "MG",
          team: tc("noTeam")
        }}
        unreadNotifications={0}
      >
        <EmptyState title={tp("insightsErrorTitle")} copy={tp("insightsErrorCopy")} />
      </DashboardShell>
    );
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  return (
    <DashboardShell
      role="manager"
      title={tp("teamTitle")}
      subtitle={tp("teamSubtitle")}
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || tc("managerRole"),
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel
      }}
      actions={<span className="quality-pill">{insights.teamRows.length} members</span>}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel">
        {insights.teamRows.length ? (
          <TeamTable people={insights.teamRows} />
        ) : (
          <EmptyState title={tp("noMembersTitle")} copy={tp("noMembersCopy")} />
        )}
      </article>
      {insights.teamRows.length ? (
        <article className="panel dashboard-panel manager-note-panel">
          <div className="panel-top">
            <div>
              <h2>{tp("noteTitle")}</h2>
              <p>{tp("noteCopy")}</p>
            </div>
          </div>
          {queryParams.note === "sent" ? <p className="team-form-feedback success">{tp("noteSent")}</p> : null}
          {queryParams.note === "error" ? <p className="team-form-feedback error">{tp("noteError")}</p> : null}
          {queryParams.note === "not_allowed" ? <p className="team-form-feedback error">{tp("noteNotAllowed")}</p> : null}
          <form className="manager-note-form" action={sendManagerNoteAction}>
            <input type="hidden" name="return_to" value={`/${locale}/manager/team`} />
            <label>
              <span>{tp("employee")}</span>
              <select name="recipient_id" required>
                <option value="">{tp("chooseEmployee")}</option>
                {insights.teamRows.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name} - {member.team}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{tp("note")}</span>
              <textarea name="note_body" rows={4} maxLength={500} placeholder={tp("notePlaceholder")} required />
            </label>
            <button className="btn btn-primary" type="submit">
              {tp("sendNote")}
            </button>
          </form>
        </article>
      ) : null}
    </DashboardShell>
  );
}
