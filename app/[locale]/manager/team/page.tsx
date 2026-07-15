import { redirect } from "next/navigation";
import { sendManagerNoteAction } from "@/app/actions/managerNotes";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { TeamTable } from "@/components/TeamTable";
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

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title="Team members" subtitle="A clear view of each person's recognition momentum." user={managerUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <article className="panel dashboard-panel"><TeamTable people={people} /></article>
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect("/auth/repair-profile");
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  return (
    <DashboardShell
      role="manager"
      title="Team members"
      subtitle="A clear view of each person's recognition momentum."
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || "Manager",
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
          <EmptyState title="No managed team members yet" copy="Assign employees to teams managed by this profile to populate this page." />
        )}
      </article>
      {insights.teamRows.length ? (
        <article className="panel dashboard-panel manager-note-panel">
          <div className="panel-top">
            <div>
              <h2>Send a team note</h2>
              <p>Send a short private notification to an employee in your managed team.</p>
            </div>
          </div>
          {queryParams.note === "sent" ? <p className="team-form-feedback success">Note sent to the employee notification bell.</p> : null}
          {queryParams.note === "error" ? <p className="team-form-feedback error">Please choose an employee and write a short note.</p> : null}
          {queryParams.note === "not_allowed" ? <p className="team-form-feedback error">This note could not be sent because the selected employee is outside your manager scope.</p> : null}
          <form className="manager-note-form" action={sendManagerNoteAction}>
            <input type="hidden" name="return_to" value={`/${locale}/manager/team`} />
            <label>
              <span>Employee</span>
              <select name="recipient_id" required>
                <option value="">Choose an employee</option>
                {insights.teamRows.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name} - {member.team}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Note</span>
              <textarea name="note_body" rows={4} maxLength={500} placeholder="Share a short recognition nudge, follow-up, or supportive note." required />
            </label>
            <button className="btn btn-primary" type="submit">
              Send note
            </button>
          </form>
        </article>
      ) : null}
    </DashboardShell>
  );
}
