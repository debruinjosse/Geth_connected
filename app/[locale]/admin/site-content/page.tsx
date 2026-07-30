import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { AdminSiteContentForm } from "@/components/AdminSiteContentForm";
import { getAllSiteContentForNamespace } from "@/lib/site-content";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export default async function AdminSiteContentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const homeEn = await getTranslations({ locale: "en", namespace: "home" });
  const homeNl = await getTranslations({ locale: "nl", namespace: "home" });

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title={t("siteContentTitle")} subtitle={t("siteContentSubtitle")} user={{ name: "GETH Admin", initials: "GA", team: tc("platformTeam") }}>
        <article className="panel dashboard-panel">
          <p className="section-copy">{t("siteContentDemoCopy")}</p>
        </article>
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/admin/site-content`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null; role: string | null }>();

  if (!profile || (profile.role !== "platform_admin" && profile.role !== "super_admin")) {
    redirect(`/${locale}/admin`);
  }

  const rows = await getAllSiteContentForNamespace("home");
  const overridesEn = Object.fromEntries(rows.filter((row) => row.locale === "en").map((row) => [row.key, row.value]));
  const overridesNl = Object.fromEntries(rows.filter((row) => row.locale === "nl").map((row) => [row.key, row.value]));

  const defaultsEn: Record<string, string> = {};
  const defaultsNl: Record<string, string> = {};
  for (const field of (await import("@/lib/site-content-fields")).HOME_CONTENT_FIELDS) {
    defaultsEn[field.key] = homeEn(field.key);
    defaultsNl[field.key] = homeNl(field.key);
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH Admin";

  return (
    <DashboardShell
      role="admin"
      title={t("siteContentTitle")}
      subtitle={t("siteContentSubtitle")}
      user={{
        name,
        initials: `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "GA",
        team: tc("platformTeam")
      }}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel admin-site-content-panel">
        <div className="panel-top">
          <div>
            <h2>{t("siteContentHeroTitle")}</h2>
            <p className="section-copy">{t("siteContentHeroCopy")}</p>
          </div>
        </div>

        <section className="admin-site-content-locale-block">
          <div className="eyebrow">English</div>
          <AdminSiteContentForm locale="en" defaults={defaultsEn} overrides={overridesEn} />
        </section>

        <section className="admin-site-content-locale-block">
          <div className="eyebrow">Nederlands</div>
          <AdminSiteContentForm locale="nl" defaults={defaultsNl} overrides={overridesNl} />
        </section>
      </article>
    </DashboardShell>
  );
}
