import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GA";
}

function statusLabel(value: boolean) {
  return value ? "Configured" : "Missing";
}

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [{ settings }, locale] = await Promise.all([searchParams, getLocale()]);
  const returnTo = `/${locale}/admin/settings`;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title="Platform settings" subtitle="Global configuration and production readiness checks." user={superAdminUser}>
        <EmptyState title="Supabase not configured" copy="Add Supabase environment variables to activate platform configuration checks." />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, profile_image")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null; role: string; profile_image: string | null }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const checks = [
    { label: "Supabase URL", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), detail: "Required for auth and database reads." },
    { label: "Supabase anon key", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), detail: "Required for browser/server session clients." },
    { label: "Service role key", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), detail: "Used by trusted seed/card helper scripts only." },
    { label: "App SMTP mailbox", ok: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM), detail: "Required for GETH invite and bulk-import emails. Use the get.pro SMTP mailbox here." },
    { label: "Stripe secret key", ok: Boolean(process.env.STRIPE_SECRET_KEY), detail: "Required for checkout and billing portal actions." },
    { label: "Stripe webhook secret", ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), detail: "Required for subscription webhook verification." },
    { label: "App URL", ok: Boolean(process.env.NEXT_PUBLIC_APP_URL), detail: "Used to generate invite and billing redirect links." }
  ];

  return (
    <DashboardShell
      role="admin"
      title="Platform settings"
      subtitle="Global configuration and production readiness checks."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH Admin",
        initials: getInitials(profile.first_name, profile.last_name),
        team: "GETH Platform",
        imageUrl: profile.profile_image
      }}
      actions={<span className="quality-pill">Read-only status</span>}
    >
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={user.email ?? "No email"}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>System configuration</h2>
              <p>No secrets are displayed here.</p>
            </div>
          </div>
          <div className="signal-list">
            {checks.map((check) => (
              <div className="signal-card" key={check.label}>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.detail}</p>
                </div>
                <span className={`energy ${check.ok ? "high" : "low"}`}>{statusLabel(check.ok)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Production notes</h2>
              <p>Editable platform settings need a dedicated `platform_settings` table.</p>
            </div>
          </div>
          <div className="settings-list">
            <p className="section-copy">Current page is intentionally read-only so production configuration cannot be changed accidentally from the UI.</p>
            <p className="section-copy">Use Supabase Auth SMTP settings for magic-link, signup, and password-reset emails. Use `.env.local` SMTP settings for GETH app invite emails.</p>
            <p className="section-copy">Once the get.pro mailbox details are available, configure them in both places so all automated user emails share the same sender identity.</p>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
