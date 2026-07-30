import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QrRouteRow = {
  id: string;
  title: string;
  category: string;
  qr_slug: string;
  active: boolean;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

export default async function AdminQrRoutesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title={t("qrRoutesTitle")} subtitle={t("qrRoutesNoSupabaseSubtitle")} user={superAdminUser}>
        <EmptyState title={t("cardsLibraryNoSupabaseTitle")} copy={t("qrRoutesNoSupabaseCopy")} />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const [{ data: routes, error }, { data: recognitions, error: recognitionsError }] = await Promise.all([
    supabase
      .from("card_library")
      .select("id, title, category, qr_slug, active")
      .order("qr_slug", { ascending: true }),
    supabase.from("recognition_events").select("card_id")
  ]);

  if (error || recognitionsError) {
    throw new Error(t("errLoadQrRoutes"));
  }
  const usageCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    usageCounts.set(recognition.card_id, (usageCounts.get(recognition.card_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="admin"
      title={t("qrRoutesTitle")}
      subtitle={t("qrRoutesSubtitle")}
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      actions={<Link className="btn btn-secondary compact" href={`/${locale}/admin/cards`}>{t("manageCardsButton")}</Link>}
    >
      <article className="panel dashboard-panel">
        <div className="table-wrap admin-table-scroll">
          {routes?.length ? (
            <table className="dashboard-table">
              <thead><tr><th>{t("tableSlug")}</th><th>{t("tableCard")}</th><th>{t("tableCategory")}</th><th>{t("tableDestination")}</th><th>{t("tableStatus")}</th><th>{t("tableClaims")}</th></tr></thead>
              <tbody>
                {(routes as QrRouteRow[]).map((route) => (
                  <tr key={route.id}>
                    <td><strong>{route.qr_slug}</strong></td>
                    <td>{route.title}</td>
                    <td>{route.category}</td>
                    <td><Link className="panel-link" href={`/${locale}/claim-card/${route.qr_slug}`}>/{locale}/claim-card/{route.qr_slug}</Link></td>
                    <td><span className="admin-status-pill">{route.active ? t("cardStatusActive") : t("cardStatusPaused")}</span></td>
                    <td>{usageCounts.get(route.id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title={t("emptyNoQrRoutesTitle")} copy={t("emptyNoQrRoutesCopy")} />
          )}
        </div>
      </article>
    </DashboardShell>
  );
}
