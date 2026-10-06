import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { MarkAllNotificationsReadButton, NotificationInbox } from "@/components/NotificationInbox";
import { employeeNotifications, managerUser } from "@/lib/demo-data";
import { getNotificationInboxPageData } from "@/lib/notification-inbox-page";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { Panel } from "@/components/ui/Panel";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function DemoNotificationsPage({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "companyPages" });

  return (
    <DashboardShell role="manager" title={t("managerNotificationsTitle")} subtitle={t("managerNotificationsSubtitle")} user={managerUser}>
      <Panel>
        <Feed>
          {employeeNotifications.map((notification) => (
            <FeedItem key={notification.id} title={notification.title} note={notification.detail} meta={notification.time} />
          ))}
        </Feed>
      </Panel>
    </DashboardShell>
  );
}

export default async function ManagerNotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "companyPages" });

  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage locale={locale} />;
  }

  const data = await getNotificationInboxPageData({
    allowedRoles: ["manager"],
    redirectTo: "/manager/notifications",
    fallbackInitials: "MG",
    locale: locale as "en" | "nl"
  });

  return (
    <DashboardShell
      role="manager"
      title={t("managerNotificationsTitle")}
      subtitle={t("managerNotificationsSubtitle")}
      user={data.user}
      unreadNotifications={data.unreadCount}
      actions={
        data.unreadCount > 0 ? (
          <MarkAllNotificationsReadButton />
        ) : null
      }
    >
      <Panel>
          <NotificationInbox
            notifications={data.notifications}
            emptyTitle={t("managerNotificationsEmptyTitle")}
            emptyCopy={t("managerNotificationsEmptyCopy")}
            emptyActionLabel={t("viewTeam")}
            emptyActionHref={`/${locale}/manager/team`}
            locale={locale}
          />
      </Panel>
    </DashboardShell>
  );
}
