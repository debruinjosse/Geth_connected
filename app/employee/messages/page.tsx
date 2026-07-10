import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { currentUser, employeeMessages } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GU";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export default async function EmployeeMessagesPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title="Messages" subtitle="A calm place for recognition notes and appreciation digests." user={currentUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <section className="dashboard-grid">
          <article className="panel dashboard-panel">
            <div className="signal-list">
              {employeeMessages.map((message) => (
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
    .select("first_name, last_name, team:teams(name)")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  if (profileError || !profile) redirect("/login?error=missing_profile");

  const [{ data: messages, error: messagesError }, unreadNotifications] = await Promise.all([
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, card:card_library(title)")
      .eq("receiver_user_id", user.id)
      .not("personal_note", "is", null)
      .order("created_at", { ascending: false }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (messagesError) throw new Error("Failed to load appreciation messages.");

  const giverIds = Array.from(new Set((messages ?? []).map((message) => message.giver_user_id).filter((value): value is string => Boolean(value))));
  const { data: givers } = giverIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", giverIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const giverMap = new Map((givers ?? []).map((giver) => [giver.id, `${giver.first_name ?? ""} ${giver.last_name ?? ""}`.trim() || "Colleague"]));
  const team = Array.isArray(profile.team) ? profile.team[0] : profile.team;

  return (
    <DashboardShell
      role="employee"
      title="Messages"
      subtitle="A calm place for recognition notes and appreciation digests."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH user",
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? "No team assigned"
      }}
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid">
        <article className="panel dashboard-panel">
          {messages?.length ? (
            <div className="signal-list">
              {messages.map((message) => {
                const card = Array.isArray(message.card) ? message.card[0] : message.card;
                const giver =
                  (message.giver_user_id ? giverMap.get(message.giver_user_id) : null) ||
                  message.giver_name ||
                  message.giver_email ||
                  "Colleague";
                return (
                  <div className="signal-card" key={message.id}>
                    <div>
                      <strong>{giver} on {card?.title ?? "your recognition"}</strong>
                      <p>{message.personal_note}</p>
                    </div>
                    <span className="quality-pill">{formatDate(message.created_at)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No appreciation messages yet" copy="When recognitions include a personal note, those messages will collect here." actionLabel="Open card library" actionHref="/cards" />
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
