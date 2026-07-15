import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { currentUser, recognitions as demoRecognitions } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GU";
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

type RecognitionRow = {
  id: string;
  created_at: string;
  personal_note: string | null;
  giver_name: string | null;
  giver_email: string | null;
  giver_user_id: string | null;
  receiver_user_id: string;
  card: { title: string; category: string } | Array<{ title: string; category: string }> | null;
};

function cardFromRow(row: RecognitionRow) {
  return Array.isArray(row.card) ? row.card[0] : row.card;
}

export default async function EmployeeCardsPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title="My cards" subtitle="Every recognition you've received or shared lives here." user={currentUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Recognition history</h2>
              <span className="quality-pill">{demoRecognitions.length} received</span>
            </div>
            <RecognitionList items={demoRecognitions} />
          </article>
          <article className="panel dashboard-panel">
            <EmptyState title="Connect Supabase for live cards" copy="Your real received and given cards will appear here once Supabase is configured." />
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
    .select("id, first_name, last_name, team_id")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      team_id: string | null;
    }>();

  if (profileError || !profile) redirect("/auth/repair-profile");

  const [{ data: team }, { data: receivedRows, error: receivedError }, { data: givenRows, error: givenError }, unreadNotifications] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, receiver_user_id, card:card_library(title, category)")
      .eq("receiver_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, receiver_user_id, card:card_library(title, category)")
      .eq("giver_user_id", user.id)
      .order("created_at", { ascending: false }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (receivedError || givenError) throw new Error("Failed to load employee card history.");

  const allRows = [...((receivedRows ?? []) as RecognitionRow[]), ...((givenRows ?? []) as RecognitionRow[])];
  const userIds = Array.from(new Set(allRows.flatMap((row) => [row.giver_user_id, row.receiver_user_id]).filter((value): value is string => Boolean(value))));
  const { data: people } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", userIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const peopleMap = new Map((people ?? []).map((person) => [person.id, `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "GETH user"]));

  const received: RecognitionItem[] = ((receivedRows ?? []) as RecognitionRow[]).flatMap((row) => {
    const card = cardFromRow(row);
    if (!card) return [];
    return [{
      id: row.id,
      from: row.giver_user_id ? peopleMap.get(row.giver_user_id) ?? "Colleague" : row.giver_name ?? row.giver_email ?? "Colleague",
      card: card.title,
      category: card.category,
      note: row.personal_note ?? "Recognition recorded without a personal note.",
      date: displayDate(row.created_at),
      createdAt: row.created_at
    }];
  });

  const given: RecognitionItem[] = ((givenRows ?? []) as RecognitionRow[]).flatMap((row) => {
    const card = cardFromRow(row);
    if (!card) return [];
    return [{
      id: row.id,
      from: `To ${peopleMap.get(row.receiver_user_id) ?? "teammate"}`,
      card: card.title,
      category: card.category,
      note: row.personal_note ?? "Recognition recorded without a personal note.",
      date: displayDate(row.created_at),
      createdAt: row.created_at
    }];
  });

  return (
    <DashboardShell
      role="employee"
      title="My cards"
      subtitle="Every recognition you've received or shared lives here."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH user",
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? "No team assigned"
      }}
      actions={
        <>
          <Link className="btn btn-primary" href="/employee/scan"><QrCode size={16} /> Scan card</Link>
          <Link className="btn btn-dark" href="/cards">Browse cards</Link>
        </>
      }
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Cards received</h2>
            <span className="quality-pill">{received.length} received</span>
          </div>
          {received.length ? <RecognitionList items={received} /> : <EmptyState title="No cards received yet" copy="Once a colleague recognizes you, your cards will appear here." />}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Cards given</h2>
            <span className="quality-pill">{given.length} sent</span>
          </div>
          {given.length ? <RecognitionList items={given} compact /> : <EmptyState title="No cards given yet" copy="Browse the card library to recognize a teammate and start your giving history." actionLabel="Open card library" actionHref="/cards" />}
        </article>
      </section>
    </DashboardShell>
  );
}
