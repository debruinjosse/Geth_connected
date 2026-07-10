import { CreditCard, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { openBillingPortalAction, startCheckoutSessionAction } from "@/app/actions/billing";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { companyAdmin } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasStripeBillingConfig } from "@/lib/stripe/server";

type BillingSearchParams = {
  billing?: string;
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "CA";
}

function formatMoney(cents: number, currency: string, interval: string) {
  if (cents === 0) return interval === "enterprise" ? "Custom" : "Free";
  return `${new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100)}/${interval}`;
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
          <h2>Stripe not connected</h2>
          <p className="section-copy">Add Supabase and Stripe environment variables to activate real checkout and billing portal actions.</p>
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
    .select("id, first_name, last_name, role, company_id, company:companies(id, company_name, subscription_plan, subscription_status, subscription_current_period_end, stripe_customer_id)")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      role: string;
      company_id: string | null;
      company:
        | {
            id: string;
            company_name: string;
            subscription_plan: string | null;
            subscription_status: string | null;
            subscription_current_period_end: string | null;
            stripe_customer_id: string | null;
          }
        | Array<{
            id: string;
            company_name: string;
            subscription_plan: string | null;
            subscription_status: string | null;
            subscription_current_period_end: string | null;
            stripe_customer_id: string | null;
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

  const [{ data: plans, error: plansError }, { data: subscription, error: subscriptionError }, unreadNotifications] = await Promise.all([
    supabase.from("plans").select("id, plan_key, name, description, price_cents, currency, interval, stripe_price_id").eq("active", true).order("sort_order"),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, stripe_subscription_id, plan:plans(name, plan_key)")
      .eq("company_id", profile.company_id)
      .maybeSingle<{
        status: string;
        current_period_end: string | null;
        cancel_at_period_end: boolean;
        stripe_subscription_id: string | null;
        plan: { name: string; plan_key: string } | Array<{ name: string; plan_key: string }> | null;
      }>(),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (plansError || subscriptionError) {
    throw new Error("Failed to load billing data.");
  }

  const currentPlan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
  const status = subscription?.status ?? company.subscription_status ?? "not_configured";
  const message = getBillingMessage(params.billing);
  const stripeConfigured = hasStripeBillingConfig();
  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(subscription.current_period_end))
    : "Not scheduled";

  return (
    <DashboardShell
      role="company"
      title="Billing"
      subtitle="Plan status, checkout, and subscription portal controls."
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
          <p>Synced from Stripe when configured</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Renewal</span>
          <strong>{renewalDate}</strong>
          <p>Current billing period end</p>
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
            <form action={openBillingPortalAction}>
              <button className="btn btn-secondary" type="submit" disabled={!stripeConfigured || !company.stripe_customer_id}>
                <ExternalLink size={16} /> Open billing portal
              </button>
            </form>
            <a className="btn btn-secondary" href="/pricing">Compare plans</a>
          </div>
        </article>
        <article className="panel dashboard-panel">
          <div className="eyebrow">Billing configuration</div>
          <h2>{stripeConfigured ? "Stripe connected" : "Stripe not configured"}</h2>
          <p className="section-copy">
            {stripeConfigured
              ? "Checkout and portal actions are ready. Webhooks keep subscription status synced."
              : "Add Stripe environment variables to enable checkout. The GETH platform stays usable without billing configured."}
          </p>
        </article>
      </section>

      <section className="dashboard-grid three">
        {(plans ?? []).length ? (
          (plans ?? []).map((plan) => (
            <article className="panel dashboard-panel billing-plan-card" key={plan.id}>
              <div className="eyebrow">{plan.plan_key}</div>
              <h2>{plan.name}</h2>
              <strong>{formatMoney(plan.price_cents, plan.currency, plan.interval)}</strong>
              <p className="section-copy">{plan.description ?? "GETH subscription plan."}</p>
              <form action={startCheckoutSessionAction}>
                <input type="hidden" name="planId" value={plan.id} />
                <button className="btn btn-primary" type="submit" disabled={!stripeConfigured || !plan.stripe_price_id}>
                  <CreditCard size={16} /> Start checkout
                </button>
              </form>
              {!plan.stripe_price_id ? <p className="section-copy">Stripe price ID needed before checkout.</p> : null}
            </article>
          ))
        ) : (
          <article className="panel dashboard-panel">
            <EmptyState eyebrow="No plans" title="Plans have not been seeded" copy="Run the billing migration to create Starter, Growth, and Enterprise plan rows." />
          </article>
        )}
      </section>
    </DashboardShell>
  );
}
