import { CheckCircle2 } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { DashboardShell } from "@/components/DashboardShell";
import { NotificationInbox } from "@/components/NotificationInbox";
import { companyAdmin, employeeNotifications } from "@/lib/demo-data";
import { getNotificationInboxPageData } from "@/lib/notification-inbox-page";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function DemoNotificationsPage() {
  return (
    <DashboardShell role="company" title="Notifications" subtitle="Company admin activity, invite updates, and workspace alerts." user={companyAdmin}>
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

export default async function CompanyNotificationsPage() {
  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage />;
  }

  const data = await getNotificationInboxPageData({
    allowedRoles: ["company_admin"],
    redirectTo: "/company",
    fallbackInitials: "CA"
  });

  return (
    <DashboardShell
      role="company"
      title="Notifications"
      subtitle="Company admin activity, invite updates, and workspace alerts."
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
            emptyTitle="No company notifications yet"
            emptyCopy="Invite acceptances, billing events, and company-wide activity alerts will appear here."
            emptyActionLabel="Manage employees"
            emptyActionHref="/company/employees"
          />
        </article>
      </section>
    </DashboardShell>
  );
}
