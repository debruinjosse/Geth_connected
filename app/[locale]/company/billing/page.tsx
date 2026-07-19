import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { companyAdmin } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BillingSearchParams = {
  billing?: string;
  invoice?: string;
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "CA";
}

function formatMoney(cents: number, currency: string, interval: string) {
  if (cents === 0) return interval === "enterprise" ? "Custom" : "Free";
  if (interval === "once") return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
  return `${new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100)}/${interval}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function getBillingMessage(code?: string) {
  switch (code) {
    case "checkout_success":
      return "Checkout completed. Stripe will update your subscription status shortly.";
    case "checkout_cancelled":
      return "Checkout was cancelled. You can restart it anytime.";
    case "stripe_not_configured":
      return "Stripe billing is not configured yet. Core app access is not blocked.";
    case "price_not_configured":
      return "This plan needs a Stripe price ID before checkout can start.";
    case "no_customer":
      return "No Stripe customer exists yet. Start checkout first, then the billing portal will become available.";
    case "checkout_failed":
      return "Stripe could not create a checkout session. Check billing configuration.";
    case "invoice_requested":
      return "Invoice payment request received. The GETH team will review it and send payment instructions.";
    case "invoice_generated":
      return "Invoice generated and emailed successfully. You can also download it from the invoice list below.";
    case "invoice_generated_email_failed":
      return "Invoice generated, but email delivery failed. Download the PDF below and check SMTP/get.pro settings.";
    case "invoice_generation_failed":
      return "Invoice request was saved, but the invoice document could not be generated. Please contact platform support.";
    case "invoice_config_missing":
      return "Invoice generation is blocked until seller and payment account details are configured in environment variables.";
    case "invoice_request_failed":
      return "Invoice request could not be saved. Please check the billing details and try again.";
    case "invoice_not_enabled":
      return "Invoice payments are not enabled for this plan.";
    case "owner_managed":
      return "Billing is managed by the GETH owner team. Company admins can view billing status and invoices here.";
    default:
      return null;
  }
}

function renderDemoBilling() {
  return (
    <DashboardShell role="company" title="Billing" subtitle="Plan status, invoices, and workspace subscription controls." user={companyAdmin}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="eyebrow">Current plan</div>
          <h2>Growth</h2>
          <p className="section-copy">Annual plan with manager dashboards, reports, and company-level culture analytics.</p>
          <a className="btn btn-primary" href="/pricing">Compare plans</a>
        </article>
        <article className="panel dashboard-panel">
          <div className="eyebrow">Billing setup</div>
          <h2>Invoice billing</h2>
          <p className="section-copy">European customers can request invoice-based payment without card checkout.</p>
        </article>
      </section>
    </DashboardShell>
  );
}

export default async function CompanyBillingPage({
  searchParams
}: {
  searchParams: Promise<BillingSearchParams>;
}) {
  const locale = await getLocale();
  if (!hasSupabaseServerConfig()) {
    return renderDemoBilling();
  }

  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoBilling();
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
    redirect("/company");
  }

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  if (!company) {
    redirect("/company/billing?billing=missing_company");
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
      .select("id, invoice_number, status, issue_date, due_date, total_cents, currency, billing_email, email_sent_at, email_error")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(10),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (subscriptionError || invoicesError) {
    throw new Error("Failed to load billing data.");
  }

  const currentPlan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  const status = subscription?.status ?? company.subscription_status ?? "not_configured";
  const message = getBillingMessage(params.billing);
  const billingMethod = subscription?.payment_method ?? company.billing_payment_method ?? "invoice";
  const invoiceStatus = subscription?.invoice_status ?? (status === "invoice_requested" ? "requested" : "not_requested");
  const billingEmail = subscription?.billing_contact_email ?? company.billing_email ?? profile.email ?? "";
  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(subscription.current_period_end))
    : "Not scheduled";

  return (
    <DashboardShell
      role="company"
      title="Billing"
      subtitle="View your plan status, finance details, and generated invoices. Payments are handled by the GETH owner team."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Company admin",
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

      <section className="dashboard-grid three report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Plan</span>
          <strong>{currentPlan?.name ?? company.subscription_plan ?? "Starter"}</strong>
          <p>Current workspace tier</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Status</span>
          <strong>{status}</strong>
          <p>{invoiceStatus.replaceAll("_", " ")}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Payment</span>
          <strong>{billingMethod}</strong>
          <p>{billingEmail || "Billing email not set"}</p>
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="eyebrow">Current plan</div>
          <h2>{currentPlan?.name ?? company.subscription_plan ?? "Starter"}</h2>
          <p className="section-copy">
            Status: <strong>{status}</strong>
            {subscription?.current_period_end ? ` - Renews ${renewalDate}` : ""}
          </p>
          <div className="button-row">
            <a className="btn btn-secondary" href="/pricing">Compare plans</a>
          </div>
        </article>
        <article className="panel dashboard-panel">
          <div className="eyebrow">Billing configuration</div>
          <h2>Owner-managed billing</h2>
          <p className="section-copy">The GETH owner team generates invoices, confirms payment, and activates company access. Company admins can download issued invoices here.</p>
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Generated invoices</h2>
            <p className="section-copy">Download official GETH invoice PDFs with invoice number, VAT, due date, and payment reference.</p>
          </div>
        </div>
        {invoices?.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Due date</th>
                  <th>Email</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoice_number}</strong></td>
                    <td>{invoice.status}</td>
                    <td>{formatMoney(invoice.total_cents, invoice.currency, "once")}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td>{invoice.email_sent_at ? "sent" : invoice.email_error ? "failed" : "pending"}</td>
                    <td>
                      <a className="panel-link" href={`/${locale}/company/billing/invoices/${invoice.id}/pdf`}>
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState eyebrow="No invoices yet" title="Generate your first invoice" copy="Choose a plan above and submit billing details to create a downloadable European invoice." />
        )}
      </article>
    </DashboardShell>
  );
}
