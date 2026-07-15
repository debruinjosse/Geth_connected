import { CheckCircle2 } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { DashboardShell } from "@/components/DashboardShell";
import { NotificationInbox } from "@/components/NotificationInbox";
import { employeeNotifications, superAdminUser } from "@/lib/demo-data";
import { getNotificationInboxPageData } from "@/lib/notification-inbox-page";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function DemoNotificationsPage() {
  return (
    <DashboardShell role="admin" title="Notifications" subtitle="Platform alerts, subscription activity, and operational updates." user={superAdminUser}>
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

export default async function AdminNotificationsPage() {
  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage />;
  }

  const data = await getNotificationInboxPageData({
    allowedRoles: ["platform_admin", "super_admin"],
    redirectTo: "/admin",
    fallbackInitials: "SA"
  });

  return (
    <DashboardShell
      role="admin"
      title="Notifications"
      subtitle="Platform alerts, subscription activity, and operational updates."
      user={data.user}
      unreadNotifications={data.unreadCount}
      actions={
        data.unreadCount > 0 ? (
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
            notifications={data.notifications}
            emptyTitle="No platform notifications yet"
            emptyCopy="Platform-level billing, company, and operational alerts will appear here."
            emptyActionLabel="View companies"
            emptyActionHref="/admin/companies"
          />
        </article>
      </section>
    </DashboardShell>
  );
}
