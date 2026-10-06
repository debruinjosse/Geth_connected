import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminInvoiceForm } from "@/components/AdminInvoiceForm";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { subscriptions, superAdminUser } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { Alert } from "@/components/ui/Alert";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pill } from "@/components/ui/Pill";
import { Table } from "@/components/ui/Table";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "SA";
}

function formatDate(value: string | null, notSetLabel: string, dateLocale: string) {
  if (!value) return notSetLabel;
  return new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" }).format(new Date(value));
}

function formatPlanPrice(cents: number | null, currency: string, planKey: string, dateLocale: string, customLabel: string) {
  if (planKey === "enterprise" || !cents || cents <= 0) return customLabel;
  return new Intl.NumberFormat(dateLocale, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function getBillingMessage(code: string | undefined, t: Awaited<ReturnType<typeof getTranslations>>) {
  switch (code) {
    case "invoice_generated":
      return t("billingInvoiceGenerated");
    case "invoice_generated_email_failed":
      return t("billingInvoiceEmailFailed");
    case "invoice_generation_failed":
      return t("billingInvoiceGenerationFailed");
    case "invoice_config_missing":
      return t("billingInvoiceConfigMissing");
    case "invoice_request_failed":
      return t("billingInvoiceRequestFailed");
    case "invoice_not_enabled":
      return t("billingInvoiceNotEnabled");
    case "custom_amount_required":
      return t("billingCustomAmountRequired");
    case "invalid_invoice_inputs":
      return t("billingInvalidInputs");
    case "unauthorized":
      return t("billingUnauthorized");
    default:
      return null;
  }
}

async function renderDemoSubscriptions(locale: string) {
  const t = await getTranslations({ locale, namespace: "adminPages" });

  return (
    <DashboardShell role="admin" title={t("subscriptionsTitle")} subtitle={t("subscriptionsSubtitle")} user={superAdminUser}>
      <Panel>
        <>
          <Table className="lp-table-flat lp-table-stack">
            <thead><tr><th>{t("tableCompany")}</th><th>{t("tablePlan")}</th><th>{t("tableRenewal")}</th><th>{t("tableStatus")}</th></tr></thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td><strong>{subscription.company}</strong></td>
                  <td data-label={t("tablePlan")}>{subscription.plan}</td>
                  <td data-label={t("tableRenewal")}>{subscription.renewal}</td>
                  <td data-label={t("tableStatus")}>{subscription.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      </Panel>
    </DashboardShell>
  );
}

export default async function AdminSubscriptionsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ billing?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const dateLocale = locale === "nl" ? "nl-NL" : "en";

  if (!hasSupabaseServerConfig()) {
    return renderDemoSubscriptions(locale);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoSubscriptions(locale);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; first_name: string | null; last_name: string | null; role: string }>();

  if (profileError || !profile) {
    redirect("/auth/repair-profile");
  }

  if (profile.role !== "platform_admin" && profile.role !== "super_admin") {
    redirect("/admin");
  }

  const [{ data: companies, error: companiesError }, { data: subscriptionRows, error: subscriptionsError }, { data: plans, error: plansError }, unreadNotifications] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, subscription_plan, subscription_status, subscription_current_period_end, billing_payment_method, billing_email, stripe_customer_id, stripe_subscription_id")
      .order("company_name"),
    supabase
      .from("subscriptions")
      .select("company_id, status, current_period_end, cancel_at_period_end, payment_method, invoice_status, invoice_requested_at, billing_contact_email, stripe_subscription_id, plan:plans(name, plan_key)")
      .order("updated_at", { ascending: false }),
    supabase.from("plans").select("id, plan_key, name, price_cents, currency, interval, invoice_enabled").eq("active", true).order("sort_order"),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companiesError || subscriptionsError || plansError) {
    throw new Error(t("errLoadSubscriptions"));
  }

  const subscriptionMap = new Map((subscriptionRows ?? []).map((row) => [row.company_id, row]));
  const activeCount = (companies ?? []).filter((company) => ["active", "trialing"].includes(company.subscription_status ?? "")).length;
  const invoiceCount = (subscriptionRows ?? []).filter((subscription) => subscription.payment_method === "invoice" || subscription.invoice_status === "requested").length;
  const message = getBillingMessage(queryParams.billing, t);

  return (
    <DashboardShell
      role="admin"
      title={t("subscriptionsTitle")}
      subtitle={t("subscriptionsSubtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("platformAdminName"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      unreadNotifications={unreadNotifications}
    >
      {message ? <Alert tone="info">{message}</Alert> : null}

      <Grid cols="three">
        <StatCard label={<>{t("summaryCompaniesEyebrow")}</>} value={<>{companies?.length ?? 0}</>} helper={<>{t("trackedWorkspaces")}</>} />
        <StatCard label={<>{t("summaryActiveBillingEyebrow")}</>} value={<>{activeCount}</>} helper={<>{t("activeOrTrialing")}</>} />
        <StatCard label={<>{t("summaryInvoiceBillingEyebrow")}</>} value={<>{invoiceCount}</>} helper={<>{t("invoiceBasedAccounts")}</>} />
      </Grid>

      {plans?.length ? (
        <Panel title={t("availablePlansTitle")} description={t("availablePlansCopy")}>
          <>
            <Table className="lp-table-flat lp-table-stack">
              <thead>
                <tr>
                  <th>{t("tablePlan")}</th>
                  <th>{t("tablePlanPrice")}</th>
                  <th>{t("tablePlanInterval")}</th>
                  <th>{t("tablePlanStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {plans
                  .filter((plan) => plan.plan_key === "growth" || plan.plan_key === "enterprise" || plan.plan_key === "starter")
                  .map((plan) => (
                    <tr key={plan.id}>
                      <td><strong>{plan.name}</strong></td>
                      <td data-label={t("tablePlanPrice")}>{formatPlanPrice(plan.price_cents, plan.currency, plan.plan_key, dateLocale, t("billingCustom"))} {t("perEmployee")}</td>
                      <td data-label={t("tablePlanInterval")}>{plan.interval === "month" ? t("billingMonthly") : plan.interval}</td>
                      <td data-label={t("tablePlanStatus")}><Pill tone={plan.invoice_enabled ? "green" : "neutral"}>{plan.invoice_enabled ? t("planInvoiceEnabled") : t("planInvoiceDisabled")}</Pill></td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </>
        </Panel>
      ) : null}

      <Panel title={t("generateCompanyInvoiceTitle")} description={t("generateCompanyInvoiceCopy")}>
        {companies?.length && plans?.length ? (
          <AdminInvoiceForm companies={companies} plans={plans} locale={locale} />
        ) : (
          <EmptyState eyebrow={t("setupNeededEyebrow")} title={t("setupNeededTitle")} copy={t("setupNeededCopy")} />
        )}
      </Panel>

      <Panel title={t("subscriptionStatusesTitle")} description={t("subscriptionStatusesCopy")}>
        {companies?.length ? (
          <>
            <Table className="lp-table-flat lp-table-stack">
              <thead>
                <tr>
                  <th>{t("tableCompany")}</th>
                  <th>{t("tablePlan")}</th>
                  <th>{t("tableStatus")}</th>
                  <th>{t("tablePaymentMethod")}</th>
                  <th>{t("tableInvoiceStatus")}</th>
                  <th>{t("tableBillingEmail")}</th>
                  <th>{t("tableRequested")}</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => {
                  const subscription = subscriptionMap.get(company.id);
                  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
                  return (
                    <tr key={company.id}>
                      <td><strong>{company.company_name}</strong></td>
                      <td data-label={t("tablePlan")}>{plan?.name ?? company.subscription_plan ?? "Starter"}</td>
                      <td data-label={t("tableStatus")}><StatusPill raw={subscription?.status ?? company.subscription_status ?? "not_configured"}>{(subscription?.status ?? company.subscription_status ?? "not_configured").replaceAll("_", " ")}</StatusPill></td>
                      <td data-label={t("tablePaymentMethod")}>{subscription?.payment_method ?? company.billing_payment_method ?? "invoice"}</td>
                      <td data-label={t("tableInvoiceStatus")}><StatusPill raw={subscription?.invoice_status ?? "not_requested"}>{(subscription?.invoice_status ?? "not_requested").replaceAll("_", " ")}</StatusPill></td>
                      <td data-label={t("tableBillingEmail")}>{subscription?.billing_contact_email ?? company.billing_email ?? tc("notSet")}</td>
                      <td data-label={t("tableRequested")}>{formatDate(subscription?.invoice_requested_at ?? subscription?.current_period_end ?? company.subscription_current_period_end, tc("notSet"), dateLocale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        ) : (
          <EmptyState eyebrow={t("emptyNoCompaniesEyebrow")} title={t("emptyNoSubscriptionTitle")} copy={t("emptyNoSubscriptionCopy")} />
        )}
      </Panel>
    </DashboardShell>
  );
}
