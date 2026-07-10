import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { DashboardShell } from "@/components/DashboardShell";
import { NotificationInbox, type NotificationInboxRow } from "@/components/NotificationInbox";
import { currentUser, employeeNotifications } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "EM";
}

function DemoNotificationsPage() {
  return (
    <DashboardShell role="employee" title="Notifications" subtitle="Important recognition updates in one place." user={currentUser}>
      <section className="dashboard-grid">
        <article className="panel dashboard-panel">
          <div className="signal-list">
            {employeeNotifications.map((notification) => (
              <div className="signal-card" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.detail}</p>
                </div>
                <span className="quality-pill">{notification.time}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}

export default async function EmployeeNotificationsPage() {
  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, team:teams(name)")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; team: { name: string } | Array<{ name: string }> | null }>();

  if (profileError || !profile) {
    redirect("/auth/repair-profile?next=/employee/notifications");
  }

  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (notificationsError) {
    throw new Error("Failed to load notifications.");
  }

  const unreadCount = await getUnreadNotificationCount(supabase, user.id);
  const team = Array.isArray(profile.team) ? profile.team[0] : profile.team;
  const rows = (notifications ?? []) as NotificationInboxRow[];

  return (
    <DashboardShell
      role="employee"
      title="Notifications"
      subtitle="Important recognition updates in one place."
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? "Employee"
      }}
      unreadNotifications={unreadCount}
      actions={
        unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button className="btn btn-secondary" type="submit">
              <CheckCircle2 size={16} /> Mark all read
            </button>
          </form>
        ) : null
      }
    >
      <section className="dashboard-grid">
        <article className="panel dashboard-panel">
          <NotificationInbox
            notifications={rows}
            emptyTitle="You are all caught up"
            emptyCopy="Recognition updates, invite activity, and important workspace events will appear here."
            emptyActionLabel="Browse cards"
            emptyActionHref="/cards"
          />
        </article>
      </section>
    </DashboardShell>
  );
}
