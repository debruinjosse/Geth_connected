import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { companyAdmin } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { getDateLocale } from "@/lib/locale-format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BillingSearchParams = {
  billing?: string;
  invoice?: string;
};

type BillingTranslation = Awaited<ReturnType<typeof getTranslations>>;

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "CA";
}

function formatMoney(cents: number, currency: string, interval: string, t: BillingTranslation) {
  if (cents === 0) return interval === "enterprise" ? t("billingCustom") : t("billingFree");
  const dateLocale = getDateLocale();
  if (interval === "once") return new Intl.NumberFormat(dateLocale, { style: "currency", currency }).format(cents / 100);
  return `${new Intl.NumberFormat(dateLocale, { style: "currency", currency }).format(cents / 100)}/${interval}`;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(getDateLocale(locale), { dateStyle: "medium" }).format(new Date(value));
}

function formatReadableStatus(value: string | null | undefined, t: BillingTranslation) {
  if (!value) return t("notSet");
  const normalized = value.toLowerCase().replace(/\s+/g, "_");
  const known = {
    paid: t("statusPaid"),
    pending: t("statusPending"),
    overdue: t("statusOverdue"),
    cancelled: t("statusCancelled"),
    draft: t("statusDraft"),
    open: t("statusOpen"),
    active: t("statusOpen")
  } as Record<string, string>;
  if (known[normalized]) return known[normalized];
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatPaymentMethod(value: string | null | undefined, t: BillingTranslation) {
  if (!value) return t("billingInvoice");
  if (value === "invoice") return t("billingInvoice");
  return formatReadableStatus(value, t);
}

function formatBillingInterval(value: string | null | undefined, t: BillingTranslation) {
  return value === "yearly" ? t("billingYearly") : t("billingMonthly");
}

function getBillingMessage(code: string | undefined, t: BillingTranslation) {
  switch (code) {
    case "checkout_success":
      return t("messages.checkoutSuccess");
    case "checkout_cancelled":
      return t("messages.checkoutCancelled");
    case "stripe_not_configured":
      return t("messages.stripeNotConfigured");
    case "price_not_configured":
      return t("messages.priceNotConfigured");
    case "no_customer":
      return t("messages.noCustomer");
    case "checkout_failed":
      return t("messages.checkoutFailed");
    case "invoice_requested":
      return t("messages.invoiceRequested");
    case "invoice_generated":
      return t("messages.invoiceGenerated");
    case "invoice_generated_email_failed":
      return t("messages.invoiceGeneratedEmailFailed");
    case "invoice_generation_failed":
      return t("messages.invoiceGenerationFailed");
    case "invoice_config_missing":
      return t("messages.invoiceConfigMissing");
    case "invoice_request_failed":
      return t("messages.invoiceRequestFailed");
    case "invoice_not_enabled":
      return t("messages.invoiceNotEnabled");
    default:
      return null;
  }
}

function renderDemoBilling(t: BillingTranslation) {
  return (
    <DashboardShell role="company" title={t("title")} subtitle={t("subtitle")} user={companyAdmin}>
      <section className="dashboard-grid two billing-simplified-grid">
        <article className="panel dashboard-panel">
          <div className="eyebrow">{t("paymentEyebrow")}</div>
          <h2>{t("invoice")}</h2>
          <p className="section-copy">info@geth.pro</p>
        </article>
        <article className="panel dashboard-panel">
          <div className="eyebrow">{t("configurationEyebrow")}</div>
          <h2>{t("configurationTitle")}</h2>
          <p className="section-copy">{t("configurationCopy")}</p>
        </article>
      </section>
    </DashboardShell>
  );
}

export default async function CompanyBillingPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<BillingSearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "companyBilling" });
  const tc = await getTranslations({ locale, namespace: "common" });
  if (!hasSupabaseServerConfig()) {
    return renderDemoBilling(t);
  }

  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoBilling(t);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, role, company_id, company:companies(id, company_name, subscription_plan, subscription_status, subscription_current_period_end, billing_payment_method, billing_email)")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      role: string;
      company_id: string | null;
      company:
        | {
            id: string;
            company_name: string;
            subscription_plan: string | null;
            subscription_status: string | null;
            subscription_current_period_end: string | null;
            billing_payment_method: string | null;
            billing_email: string | null;
          }
        | Array<{
            id: string;
            company_name: string;
            subscription_plan: string | null;
            subscription_status: string | null;
            subscription_current_period_end: string | null;
            billing_payment_method: string | null;
            billing_email: string | null;
          }>
        | null;
    }>();

  if (profileError || !profile?.company_id) {
    redirect("/auth/repair-profile");
  }

  if (profile.role !== "company_admin") {
    redirect(`/${locale}/company`);
  }

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  if (!company) {
    redirect(`/${locale}/company/billing?billing=missing_company`);
  }

  const [{ data: subscription, error: subscriptionError }, { data: invoices, error: invoicesError }, unreadNotifications] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, payment_method, invoice_status, invoice_requested_at, billing_contact_email, plan:plans(name, plan_key)")
      .eq("company_id", profile.company_id)
      .maybeSingle<{
        status: string;
        current_period_end: string | null;
        cancel_at_period_end: boolean;
        payment_method: string | null;
        invoice_status: string | null;
        invoice_requested_at: string | null;
        billing_contact_email: string | null;
        plan: { name: string; plan_key: string } | Array<{ name: string; plan_key: string }> | null;
      }>(),
    supabase
      .from("billing_invoices")
      .select("id, invoice_number, status, issue_date, due_date, total_cents, currency, billing_email, billing_interval, seat_count, email_sent_at, email_error")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(10),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (subscriptionError || invoicesError) {
    throw new Error("Failed to load billing data.");
  }

  const message = getBillingMessage(query.billing, t);
  const billingMethod = subscription?.payment_method ?? company.billing_payment_method ?? "invoice";
  const billingEmail = subscription?.billing_contact_email ?? company.billing_email ?? profile.email ?? "";

  return (
    <DashboardShell
      role="company"
      title={t("title")}
      subtitle={t("subtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("companyAdminRole"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: company.company_name
      }}
      unreadNotifications={unreadNotifications}
    >
      {message ? (
        <section className="panel dashboard-panel billing-status-banner">
          <strong>{message}</strong>
        </section>
      ) : null}

      <section className="dashboard-grid two billing-simplified-grid">
        <article className="panel dashboard-panel report-summary-card billing-payment-card">
          <span className="eyebrow">{t("paymentEyebrow")}</span>
          <strong>{formatPaymentMethod(billingMethod, t)}</strong>
          <p>{billingEmail || t("billingEmailMissing")}</p>
        </article>
        <article className="panel dashboard-panel">
          <div className="eyebrow">{t("configurationEyebrow")}</div>
          <h2>{t("configurationTitle")}</h2>
          <p className="section-copy">{t("configurationCopy")}</p>
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("generatedInvoices")}</h2>
            <p className="section-copy">{t("generatedInvoicesCopy")}</p>
          </div>
        </div>
        {invoices?.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{t("invoice")}</th>
                  <th>{t("status")}</th>
                  <th>{t("total")}</th>
                  <th>{t("billingPeriod")}</th>
                  <th>{t("users")}</th>
                  <th>{t("dueDate")}</th>
                  <th>{t("email")}</th>
                  <th>{t("pdf")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoice_number}</strong></td>
                    <td>{formatReadableStatus(invoice.status, t)}</td>
                    <td>{formatMoney(invoice.total_cents, invoice.currency, "once", t)}</td>
                    <td>{formatBillingInterval(invoice.billing_interval, t)}</td>
                    <td>{invoice.seat_count ?? 1}</td>
                    <td>{invoice.due_date ? formatDate(invoice.due_date, locale) : t("notSet")}</td>
                    <td>{invoice.email_sent_at ? t("emailSent") : invoice.email_error ? t("emailFailed") : t("emailPending")}</td>
                    <td>
                      <a className="panel-link" href={`/${locale}/company/billing/invoices/${invoice.id}/pdf`}>
                        {t("download")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState eyebrow={t("emptyEyebrow")} title={t("emptyTitle")} copy={t("emptyCopy")} />
        )}
      </article>
    </DashboardShell>
  );
}
