import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getLocalizedCardTitle } from "@/lib/cards";
import { currentUser } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GU";
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(value));
}

export default async function EmployeeMessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employeePages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!hasSupabaseServerConfig()) {
    const demoMessages = [
      { id: "m1", title: t("demoMessage1Title"), excerpt: t("demoMessage1Excerpt"), time: t("demoMessage1Time") },
      { id: "m2", title: t("demoMessage2Title"), excerpt: t("demoMessage2Excerpt"), time: t("demoMessage2Time") }
    ];
    return (
      <DashboardShell role="employee" title={t("messagesTitle")} subtitle="" user={currentUser} actions={<span className="quality-pill">{tc("demoFallback")}</span>}>
        <section className="dashboard-grid">
          <article className="panel dashboard-panel">
            <div className="signal-list">
              {demoMessages.map((message) => (
                <div className="signal-card" key={message.id}>
                  <div>
                    <strong>{message.title}</strong>
                    <p>{message.excerpt}</p>
                  </div>
                  <span className="quality-pill">{message.time}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
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
    .select("first_name, last_name, team_id, profile_image")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      team_id: string | null;
      profile_image: string | null;
    }>();

  if (profileError || !profile) redirect("/auth/repair-profile");

  const [{ data: team }, { data: messages, error: messagesError }, unreadNotifications] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, card:card_library(title, card_number, qr_slug)")
      .eq("receiver_user_id", user.id)
      .not("personal_note", "is", null)
      .order("created_at", { ascending: false }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (messagesError) throw new Error(t("errLoadMessages"));

  const giverIds = Array.from(new Set((messages ?? []).map((message) => message.giver_user_id).filter((value): value is string => Boolean(value))));
  const { data: givers } = giverIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", giverIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const giverMap = new Map((givers ?? []).map((giver) => [giver.id, `${giver.first_name ?? ""} ${giver.last_name ?? ""}`.trim() || tc("colleague")]));

  return (
    <DashboardShell
      role="employee"
      title={t("messagesTitle")}
      subtitle=""
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("gethUser"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? tc("noTeam"),
        imageUrl: profile.profile_image
      }}
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid">
        <article className="panel dashboard-panel">
          {messages?.length ? (
            <div className="signal-list">
              {messages.map((message) => {
                const card = Array.isArray(message.card) ? message.card[0] : message.card;
                const cardTitle = card
                  ? getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale)
                  : t("yourRecognition");
                const giver =
                  (message.giver_user_id ? giverMap.get(message.giver_user_id) : null) ||
                  message.giver_name ||
                  message.giver_email ||
                  tc("colleague");
                return (
                  <div className="signal-card" key={message.id}>
                    <div>
                      <strong>{t("messageHeading", { card: cardTitle, giver })}</strong>
                      <p>{message.personal_note}</p>
                    </div>
                    <span className="quality-pill">{formatDate(message.created_at, locale)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t("messagesEmptyTitle")} copy={t("messagesEmptyCopy")} actionLabel={tc("openCardLibrary")} actionHref="/cards" />
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
