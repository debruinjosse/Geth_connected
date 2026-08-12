import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { AdminBillingSettingsForm } from "@/components/AdminBillingSettingsForm";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import {
  getEnvInvoiceConfig,
  getMissingInvoiceConfig,
  loadPlatformBillingSettings,
  platformBillingSettingsToFormValues
} from "@/lib/billing/platform-settings";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GA";
}

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [{ settings }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const returnTo = `/${locale}/admin/settings`;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title={t("settingsTitle")} subtitle={t("settingsSubtitle")} user={superAdminUser}>
        <EmptyState title={t("settingsNoSupabaseTitle")} copy={t("settingsNoSupabaseCopy")} />
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
    .select("first_name, last_name, role, profile_image")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null; role: string; profile_image: string | null }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const billingSettingsRow = await loadPlatformBillingSettings(supabase);
  const billingFormValues = platformBillingSettingsToFormValues(billingSettingsRow, getEnvInvoiceConfig());
  const missingInvoiceFields = await getMissingInvoiceConfig(supabase);

  const checks = [
    { label: t("checkSupabaseUrl"), ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), detail: t("checkSupabaseUrlDetail") },
    { label: t("checkSupabaseAnonKey"), ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), detail: t("checkSupabaseAnonKeyDetail") },
    { label: t("checkServiceRoleKey"), ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), detail: t("checkServiceRoleKeyDetail") },
    { label: t("checkAppSmtp"), ok: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM), detail: t("checkAppSmtpDetail") },
    {
      label: t("checkSmtpMailbox"),
      ok: /geth\.pro/i.test(process.env.SMTP_FROM ?? "") && /geth\.pro/i.test(process.env.SMTP_USER ?? ""),
      detail: t("checkSmtpMailboxDetail")
    },
    { label: t("checkStripeSecret"), ok: Boolean(process.env.STRIPE_SECRET_KEY), detail: t("checkStripeSecretDetail") },
    { label: t("checkStripeWebhook"), ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), detail: t("checkStripeWebhookDetail") },
    { label: t("checkAppUrl"), ok: Boolean(process.env.NEXT_PUBLIC_APP_URL), detail: t("checkAppUrlDetail") },
    {
      label: t("checkInvoiceSeller"),
      ok: missingInvoiceFields.length === 0,
      detail: missingInvoiceFields.length
        ? t("checkInvoiceSellerMissing", { fields: missingInvoiceFields.join(", ") })
        : t("checkInvoiceSellerDetail")
    }
  ];

  return (
    <DashboardShell
      role="admin"
      title={t("settingsTitle")}
      subtitle={t("settingsSubtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("platformAdminName"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam"),
        imageUrl: profile.profile_image
      }}
      actions={<span className="quality-pill">{t("readOnlyStatusPill")}</span>}
    >
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={user.email ?? tc("noEmail")}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("systemConfigurationTitle")}</h2>
              <p>{t("systemConfigurationCopy")}</p>
            </div>
          </div>
          <div className="signal-list">
            {checks.map((check) => (
              <div className="signal-card" key={check.label}>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.detail}</p>
                </div>
                <span className={`energy ${check.ok ? "high" : "low"}`}>{check.ok ? t("configuredLabel") : t("missingLabel")}</span>
              </div>
            ))}
          </div>
        </article>
        <AdminBillingSettingsForm locale={locale} values={billingFormValues} statusCode={settings} />
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("productionNotesTitle")}</h2>
              <p>{t("productionNotesTableCopy")}</p>
            </div>
          </div>
          <div className="settings-list">
            <p className="section-copy">{t("productionNotesReadOnly")}</p>
            <p className="section-copy">{t("productionNotesSmtp")}</p>
            <p className="section-copy">{t("productionNotesMailbox")}</p>
            <p className="section-copy">{t("productionNotesConcurrent")}</p>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
