import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { MarkAllNotificationsReadButton, NotificationInbox } from "@/components/NotificationInbox";
import { companyAdmin, employeeNotifications } from "@/lib/demo-data";
import { getNotificationInboxPageData } from "@/lib/notification-inbox-page";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { Panel } from "@/components/ui/Panel";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function DemoNotificationsPage({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "companyPages" });

  return (
    <DashboardShell role="company" title={t("notificationsTitle")} subtitle={t("notificationsSubtitle")} user={companyAdmin}>
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

export default async function CompanyNotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "companyPages" });

  if (!hasSupabaseServerConfig()) {
    return <DemoNotificationsPage locale={locale} />;
  }

  const data = await getNotificationInboxPageData({
    allowedRoles: ["company_admin"],
    redirectTo: "/company/notifications",
    fallbackInitials: "CA",
    locale: locale as "en" | "nl"
  });

  return (
    <DashboardShell
      role="company"
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
      <Panel>
          <NotificationInbox
            notifications={data.notifications}
            emptyTitle={t("notificationsEmptyTitle")}
            emptyCopy={t("notificationsEmptyCopy")}
            emptyActionLabel={t("manageEmployees")}
            emptyActionHref={`/${locale}/company/employees`}
            locale={locale}
          />
      </Panel>
    </DashboardShell>
  );
}
