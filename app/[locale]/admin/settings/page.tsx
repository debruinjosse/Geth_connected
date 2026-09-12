import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { AdminBillingSettingsForm } from "@/components/AdminBillingSettingsForm";
import { AiMasterPromptSettingsForm } from "@/components/AiMasterPromptSettingsForm";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { loadAiMasterPromptSettings } from "@/lib/ai/master-prompt-settings";
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

  const aiPromptSettingsRow = await loadAiMasterPromptSettings(supabase);
  let aiPromptUpdatedByLabel: string | null = null;
  if (aiPromptSettingsRow?.updated_by) {
    const { data: updatedByProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", aiPromptSettingsRow.updated_by)
      .maybeSingle<{ first_name: string | null; last_name: string | null }>();
    aiPromptUpdatedByLabel = `${updatedByProfile?.first_name ?? ""} ${updatedByProfile?.last_name ?? ""}`.trim() || null;
  }

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
        <AiMasterPromptSettingsForm
          locale={locale}
          toneGuidance={aiPromptSettingsRow?.tone_guidance ?? ""}
          isDefault={!aiPromptSettingsRow?.tone_guidance}
          updatedByLabel={aiPromptUpdatedByLabel}
          updatedAt={aiPromptSettingsRow?.updated_at ?? null}
          statusCode={settings}
        />
        <article className="panel dashboard-panel full-span">
          <div className="panel-top">
            <div>
              <h2>{t("productionNotesTitle")}</h2>
              <p>{t("productionNotesTableCopy")}</p>
            </div>
          </div>
          <div className="signal-list">
            {[
              { title: t("productionNotesReadOnlyTitle"), detail: t("productionNotesReadOnly") },
              { title: t("productionNotesSmtpTitle"), detail: t("productionNotesSmtp") },
              { title: t("productionNotesMailboxTitle"), detail: t("productionNotesMailbox") },
              { title: t("productionNotesConcurrentTitle"), detail: t("productionNotesConcurrent") }
            ].map((note) => (
              <div className="signal-card" key={note.title}>
                <div>
                  <strong>{note.title}</strong>
                  <p>{note.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
