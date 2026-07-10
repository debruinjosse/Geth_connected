import { redirect } from "next/navigation";
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

export default async function AdminSubscriptionsPage() {
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
    redirect("/login?error=missing_profile");
  }

  if (profile.role !== "platform_admin" && profile.role !== "super_admin") {
    redirect("/admin");
  }

  const [{ data: companies, error: companiesError }, { data: subscriptionRows, error: subscriptionsError }, unreadNotifications] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, subscription_plan, subscription_status, subscription_current_period_end, stripe_customer_id, stripe_subscription_id")
      .order("company_name"),
    supabase
      .from("subscriptions")
      .select("company_id, status, current_period_end, cancel_at_period_end, stripe_subscription_id, plan:plans(name, plan_key)")
      .order("updated_at", { ascending: false }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companiesError || subscriptionsError) {
    throw new Error("Failed to load subscription data.");
  }

  const subscriptionMap = new Map((subscriptionRows ?? []).map((row) => [row.company_id, row]));
  const activeCount = (companies ?? []).filter((company) => ["active", "trialing"].includes(company.subscription_status ?? "")).length;
  const configuredCount = (companies ?? []).filter((company) => Boolean(company.stripe_customer_id)).length;

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
          <span className="eyebrow">Stripe customers</span>
          <strong>{configuredCount}</strong>
          <p>customer IDs stored</p>
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Subscription statuses</h2>
            <p className="section-copy">Synced from Stripe webhooks when billing is configured.</p>
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
                  <th>Renewal</th>
                  <th>Stripe customer</th>
                  <th>Stripe subscription</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => {
                  const subscription = subscriptionMap.get(company.id);
                  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan;
                  const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id || company.stripe_subscription_id);
                  return (
                    <tr key={company.id}>
                      <td><strong>{company.company_name}</strong></td>
                      <td>{plan?.name ?? company.subscription_plan ?? "Starter"}</td>
                      <td>{subscription?.status ?? company.subscription_status ?? "not_configured"}</td>
                      <td>{formatDate(subscription?.current_period_end ?? company.subscription_current_period_end)}</td>
                      <td>{company.stripe_customer_id ? "Connected" : "Missing"}</td>
                      <td>{hasStripeSubscription ? "Connected" : "Missing"}</td>
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
