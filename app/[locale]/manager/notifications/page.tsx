import { DashboardShell } from "@/components/DashboardShell";
import { MarkAllNotificationsReadButton, NotificationInbox } from "@/components/NotificationInbox";
import { employeeNotifications, managerUser } from "@/lib/demo-data";
import { getNotificationInboxPageData } from "@/lib/notification-inbox-page";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function DemoNotificationsPage() {
  return (
    <DashboardShell role="manager" title="Notifications" subtitle="Team signals, invite updates, and manager activity in one place." user={managerUser}>
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

export default async function ManagerNotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage />;
  }

  const data = await getNotificationInboxPageData({
    allowedRoles: ["manager"],
    redirectTo: "/manager",
    fallbackInitials: "MG"
  });

  return (
    <DashboardShell
      role="manager"
      title="Notifications"
      subtitle="Team signals, invite updates, and manager activity in one place."
      user={data.user}
      unreadNotifications={data.unreadCount}
      actions={
        data.unreadCount > 0 ? (
          <MarkAllNotificationsReadButton />
        ) : null
      }
    >
      <section className="dashboard-grid">
        <article className="panel dashboard-panel">
          <NotificationInbox
            notifications={data.notifications}
            emptyTitle="No manager notifications yet"
            emptyCopy="Team recognition alerts, invite acceptances, and important manager updates will appear here."
            emptyActionLabel="View team"
            emptyActionHref="/manager/team"
            locale={locale}
          />
        </article>
      </section>
    </DashboardShell>
  );
}
