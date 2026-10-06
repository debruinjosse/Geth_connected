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
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

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

  const [growthTimelinePromptRow, hiddenPatternsPromptRow, masterPromptRow] = await Promise.all([
    loadAiMasterPromptSettings(supabase, "growth_timeline"),
    loadAiMasterPromptSettings(supabase, "hidden_patterns"),
    loadAiMasterPromptSettings(supabase, "master_prompt")
  ]);

  async function resolveUpdatedByLabel(updatedBy: string | null) {
    if (!updatedBy) return null;
    const { data: updatedByProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", updatedBy)
      .maybeSingle<{ first_name: string | null; last_name: string | null }>();
    return `${updatedByProfile?.first_name ?? ""} ${updatedByProfile?.last_name ?? ""}`.trim() || null;
  }

  const [growthTimelineUpdatedByLabel, hiddenPatternsUpdatedByLabel, masterPromptUpdatedByLabel] = await Promise.all([
    resolveUpdatedByLabel(growthTimelinePromptRow?.updated_by ?? null),
    resolveUpdatedByLabel(hiddenPatternsPromptRow?.updated_by ?? null),
    resolveUpdatedByLabel(masterPromptRow?.updated_by ?? null)
  ]);

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
      actions={<Pill>{t("readOnlyStatusPill")}</Pill>}
    >
      <Panel title={t("systemConfigurationTitle")} description={t("systemConfigurationCopy")}>
        <div className="lp-tiles">
          {checks.map((check) => (
            <div className="lp-tile" key={check.label}>
              <div>
                <strong>{check.label}</strong>
                <small>{check.detail}</small>
              </div>
              <Pill tone={check.ok ? "green" : "gold"}>{check.ok ? t("configuredLabel") : t("missingLabel")}</Pill>
            </div>
          ))}
        </div>
      </Panel>

      <Grid cols="two" className="lp-grid-balanced">
        <AccountSettingsPanel
          email={user.email ?? tc("noEmail")}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />

        <Panel title={t("productionNotesTitle")} description={t("productionNotesTableCopy")}>
          <div className="lp-tiles lp-tiles-one">
            {[
              { title: t("productionNotesReadOnlyTitle"), detail: t("productionNotesReadOnly") },
              { title: t("productionNotesSmtpTitle"), detail: t("productionNotesSmtp") },
              { title: t("productionNotesMailboxTitle"), detail: t("productionNotesMailbox") },
              { title: t("productionNotesConcurrentTitle"), detail: t("productionNotesConcurrent") }
            ].map((note) => (
              <div className="lp-tile" key={note.title}>
                <div>
                  <strong>{note.title}</strong>
                  <small>{note.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Grid>

      <AdminBillingSettingsForm locale={locale} values={billingFormValues} statusCode={settings} />

      <Grid cols="three" className="lp-grid-prompts">
          <AiMasterPromptSettingsForm
            locale={locale}
            insightType="growth_timeline"
            title={t("aiPromptSettingsGrowthTimelineTitle")}
            copy={t("aiPromptSettingsGrowthTimelineCopy")}
            toneGuidance={growthTimelinePromptRow?.tone_guidance ?? ""}
            isDefault={!growthTimelinePromptRow?.tone_guidance}
            updatedByLabel={growthTimelineUpdatedByLabel}
            updatedAt={growthTimelinePromptRow?.updated_at ?? null}
            statusCode={settings}
          />
          <AiMasterPromptSettingsForm
            locale={locale}
            insightType="hidden_patterns"
            title={t("aiPromptSettingsHiddenPatternsTitle")}
            copy={t("aiPromptSettingsHiddenPatternsCopy")}
            toneGuidance={hiddenPatternsPromptRow?.tone_guidance ?? ""}
            isDefault={!hiddenPatternsPromptRow?.tone_guidance}
            updatedByLabel={hiddenPatternsUpdatedByLabel}
            updatedAt={hiddenPatternsPromptRow?.updated_at ?? null}
            statusCode={settings}
          />
          <AiMasterPromptSettingsForm
            locale={locale}
            insightType="master_prompt"
            title={t("aiPromptSettingsMasterPromptTitle")}
            copy={t("aiPromptSettingsMasterPromptCopy")}
            toneGuidance={masterPromptRow?.tone_guidance ?? ""}
            isDefault={!masterPromptRow?.tone_guidance}
            updatedByLabel={masterPromptUpdatedByLabel}
            updatedAt={masterPromptRow?.updated_at ?? null}
            statusCode={settings}
          />
      </Grid>

    </DashboardShell>
  );
}
