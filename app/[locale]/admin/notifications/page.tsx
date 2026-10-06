import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { MarkAllNotificationsReadButton, NotificationInbox } from "@/components/NotificationInbox";
import { employeeNotifications, superAdminUser } from "@/lib/demo-data";
import { getNotificationInboxPageData } from "@/lib/notification-inbox-page";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function DemoNotificationsPage({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "adminPages" });

  return (
    <DashboardShell role="admin" title={t("notificationsTitle")} subtitle={t("notificationsSubtitle")} user={superAdminUser}>
      <div className="lp-stack">
        <Panel>
          <div className="signal-list">
            {employeeNotifications.map((notification) => (
              <div className="signal-card" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.detail}</p>
                </div>
                <Pill>{notification.time}</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}

export default async function AdminNotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });

  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage locale={locale} />;
  }

  const data = await getNotificationInboxPageData({
    allowedRoles: ["platform_admin", "super_admin"],
    redirectTo: "/admin/notifications",
    fallbackInitials: "SA",
    locale: locale as "en" | "nl"
  });

  return (
    <DashboardShell
      role="admin"
      title={t("notificationsTitle")}
      subtitle={t("notificationsSubtitle")}
      user={data.user}
      unreadNotifications={data.unreadCount}
      actions={
        data.unreadCount > 0 ? (
          <MarkAllNotificationsReadButton />
        ) : null
      }
    >
      <div className="lp-stack">
        <Panel>
          <NotificationInbox
            notifications={data.notifications}
            emptyTitle={t("emptyNoNotificationsTitle")}
            emptyCopy={t("emptyNoNotificationsCopy")}
            emptyActionLabel={t("viewCompanies")}
            emptyActionHref="/admin/companies"
            locale={locale}
          />
        </Panel>
      </div>
    </DashboardShell>
  );
}
