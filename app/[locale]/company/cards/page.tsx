import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { companyAdmin, cardManagementRows } from "@/lib/demo-data";
import { getCategoryDisplayName } from "@/lib/cards";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "CA";
}

function renderDemoCards(locale = "en") {
  return (
    <DashboardShell role="company" title="Cards & Decks" subtitle="Manage deck visibility, statuses, and linked claim routes." user={companyAdmin} actions={<a className="btn btn-dark" href={`/${locale}/cards`}>Open public library</a>}>
      <article className="panel dashboard-panel">
        <div className="company-card-admin-grid">
          {cardManagementRows.map((card) => (
            <article className="company-card-admin-card" key={card.id}>
              <div>
                <span className="eyebrow">{card.category}</span>
                <h3>{card.title}</h3>
                <p>{card.sentence}</p>
              </div>
              <div className="company-card-admin-meta">
                <span>#{card.number}</span>
                <span className="energy high">{card.status}</span>
              </div>
              <a className="btn btn-secondary" href={`/${locale}/claim-card/${card.slug}`}>Open QR route</a>
            </article>
          ))}
        </div>
      </article>
    </DashboardShell>
  );
}

export default async function CompanyCardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!hasSupabaseServerConfig()) {
    return renderDemoCards(locale);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoCards(locale);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, company_id, company:companies(company_name)")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      role: string;
      company_id: string | null;
      company: { company_name: string } | Array<{ company_name: string }> | null;
    }>();

  if (profileError || !profile) {
    redirect("/auth/repair-profile");
  }

  if (profile.role !== "company_admin") {
    redirect(`/${locale}/company`);
  }

  const [{ data: cards, error: cardsError }, { data: recognitions, error: recognitionsError }, unreadNotifications] = await Promise.all([
    supabase
      .from("card_library")
      .select("id, card_number, title, category, recognition_sentence, qr_slug, active")
      .order("card_number"),
    profile.company_id
      ? supabase.from("recognition_events").select("card_id").eq("company_id", profile.company_id)
      : Promise.resolve({ data: [], error: null }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (cardsError || recognitionsError) {
    throw new Error("Failed to load cards and decks.");
  }

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  const usageCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    usageCounts.set(recognition.card_id, (usageCounts.get(recognition.card_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="company"
      title="Cards & Decks"
      subtitle="Manage deck visibility, statuses, and linked claim routes."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Company admin",
        initials: getInitials(profile.first_name, profile.last_name),
        team: company?.company_name ?? "Company admin"
      }}
      actions={<a className="btn btn-dark" href={`/${locale}/cards`}>Open public library</a>}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel">
        {cards?.length ? (
          <div className="company-card-admin-grid">
            {cards.map((card) => (
              <article className="company-card-admin-card" key={card.id}>
                <div>
                  <span className="eyebrow">{getCategoryDisplayName(card.category)}</span>
                  <h3>{card.title}</h3>
                  <p>{card.recognition_sentence}</p>
                </div>
                <div className="company-card-admin-meta">
                  <span>#{String(card.card_number).padStart(2, "0")}</span>
                  <span className={`energy ${card.active ? "high" : "low"}`.trim()}>{card.active ? "Active" : "Inactive"}</span>
                  <span>{usageCounts.get(card.id) ?? 0} used</span>
                </div>
                <a className="btn btn-secondary" href={`/${locale}/claim-card/${card.qr_slug}`}>Open QR route</a>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState eyebrow="No cards" title="Card library is empty" copy="Seed the GETH card deck to manage company card routes here." />
        )}
      </article>
    </DashboardShell>
  );
}
