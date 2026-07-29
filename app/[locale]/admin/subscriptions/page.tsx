import { redirect } from "next/navigation";
import { AdminInvoiceForm } from "@/components/AdminInvoiceForm";
import { BrandLogo } from "@/components/BrandLogo";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { subscriptions, superAdminUser } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "SA";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function getBillingMessage(code?: string) {
  switch (code) {
    case "invoice_generated":
      return "Invoice generated and emailed successfully. The company admin can download it from their billing page.";
    case "invoice_generated_email_failed":
      return "Invoice generated, but email delivery failed. Check SMTP/get.pro settings.";
    case "invoice_generation_failed":
      return "Invoice request was saved, but the invoice document could not be generated.";
    case "invoice_config_missing":
      return "Invoice generation is blocked until seller and payment account details are configured.";
    case "invoice_request_failed":
      return "Invoice request could not be saved. Please check the billing details and try again.";
    case "invoice_not_enabled":
      return "Invoice payment is not enabled for this plan.";
    case "custom_amount_required":
      return "Enterprise/custom plans need a custom invoice amount before the invoice can be generated.";
    case "invalid_invoice_inputs":
      return "Choose a billing interval and enter a valid number of users per month.";
    case "unauthorized":
      return "Only the GETH owner/super admin can manage billing.";
    default:
      return null;
  }
}

function renderDemoSubscriptions() {
  return (
    <DashboardShell role="admin" title="Subscriptions" subtitle="Plan visibility and renewal status across the platform." user={superAdminUser}>
      <article className="panel dashboard-panel">
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Company</th><th>Plan</th><th>Renewal</th><th>Status</th></tr></thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td><strong>{subscription.company}</strong></td>
                  <td>{subscription.plan}</td>
                  <td>{subscription.renewal}</td>
                  <td>{subscription.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
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

  if (!hasSupabaseServerConfig()) {
    return renderDemoSubscriptions();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoSubscriptions();
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
    throw new Error("Failed to load subscription data.");
  }

  const subscriptionMap = new Map((subscriptionRows ?? []).map((row) => [row.company_id, row]));
  const activeCount = (companies ?? []).filter((company) => ["active", "trialing"].includes(company.subscription_status ?? "")).length;
  const invoiceCount = (subscriptionRows ?? []).filter((subscription) => subscription.payment_method === "invoice" || subscription.invoice_status === "requested").length;
  const message = getBillingMessage(queryParams.billing);

  return (
    <DashboardShell
      role="admin"
      title="Subscriptions"
      subtitle="Plan visibility and renewal status across the platform."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH Admin",
        initials: getInitials(profile.first_name, profile.last_name),
        team: "Platform"
      }}
      unreadNotifications={unreadNotifications}
    >
      <section className="panel dashboard-panel admin-invoice-hero">
        <div>
          <BrandLogo compact interactive={false} />
          <span className="eyebrow">Owner invoice console</span>
          <h2>Generate polished GETH invoices</h2>
          <p>
            Create European invoice-based payment documents with seller details, VAT, payment reference, and a downloadable PDF for the company admin.
          </p>
        </div>
        <div className="admin-invoice-hero-card" aria-hidden="true">
          <span>GETH</span>
          <strong>Invoice</strong>
          <small>Logo · VAT · IBAN · PDF</small>
        </div>
      </section>

      {message ? (
        <section className="panel dashboard-panel billing-status-banner">
          <strong>{message}</strong>
        </section>
      ) : null}

      <section className="dashboard-grid three report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Companies</span>
          <strong>{companies?.length ?? 0}</strong>
          <p>tracked workspaces</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Active billing</span>
          <strong>{activeCount}</strong>
          <p>active or trialing</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Invoice billing</span>
          <strong>{invoiceCount}</strong>
          <p>invoice-based accounts</p>
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Generate company invoice</h2>
            <p className="section-copy">Billing is owner-managed: generate the invoice first, confirm payment, then invite the first company admin from the company hierarchy.</p>
          </div>
        </div>
        {companies?.length && plans?.length ? (
          <AdminInvoiceForm companies={companies} plans={plans} locale={locale} />
        ) : (
          <EmptyState eyebrow="Setup needed" title="Companies or plans missing" copy="Create a company workspace and seed billing plans before generating invoices." />
        )}
      </article>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Subscription statuses</h2>
            <p className="section-copy">Invoice-first billing status for European customers. Stripe IDs are retained only when legacy checkout was used.</p>
          </div>
        </div>
        {companies?.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Payment method</th>
                  <th>Invoice status</th>
                  <th>Billing email</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => {
                  const subscription = subscriptionMap.get(company.id);
                  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
                  return (
                    <tr key={company.id}>
                      <td><strong>{company.company_name}</strong></td>
                      <td>{plan?.name ?? company.subscription_plan ?? "Starter"}</td>
                      <td>{subscription?.status ?? company.subscription_status ?? "not_configured"}</td>
                      <td>{subscription?.payment_method ?? company.billing_payment_method ?? "invoice"}</td>
                      <td>{subscription?.invoice_status ?? "not_requested"}</td>
                      <td>{subscription?.billing_contact_email ?? company.billing_email ?? "Not set"}</td>
                      <td>{formatDate(subscription?.invoice_requested_at ?? subscription?.current_period_end ?? company.subscription_current_period_end)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState eyebrow="No companies" title="No subscription data yet" copy="Companies will appear here after workspaces are created." />
        )}
      </article>
    </DashboardShell>
  );
}
