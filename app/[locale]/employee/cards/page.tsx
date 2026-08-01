import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { getLocalizedCardTitle } from "@/lib/cards";
import { currentUser, recognitions as demoRecognitions } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GU";
}

function displayDate(value: string, locale: string) {
  const dateLocale = locale === "nl" ? "nl-NL" : "en-US";
  return new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

type RecognitionRow = {
  id: string;
  created_at: string;
  personal_note: string | null;
  giver_name: string | null;
  giver_email: string | null;
  giver_user_id: string | null;
  receiver_user_id: string;
  card: { title: string; category: string; qr_slug?: string | null } | Array<{ title: string; category: string; qr_slug?: string | null }> | null;
};

function cardFromRow(row: RecognitionRow) {
  return Array.isArray(row.card) ? row.card[0] : row.card;
}

export default async function EmployeeCardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employeePages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title={t("cardsTitle")} subtitle={t("cardsSubtitle")} user={currentUser} actions={<span className="quality-pill">{tc("demoFallback")}</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("historyTitle")}</h2>
              <span className="quality-pill">{t("countReceived", { count: demoRecognitions.length })}</span>
            </div>
            <RecognitionList items={demoRecognitions} />
          </article>
          <article className="panel dashboard-panel">
            <EmptyState title={t("supabaseEmptyTitle")} copy={t("supabaseEmptyCopy")} />
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

  if (userError || !user) redirect(`/${locale}/login`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, team_id, profile_image")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      team_id: string | null;
      profile_image: string | null;
    }>();

  if (profileError || !profile) redirect("/auth/repair-profile");

  const [{ data: team }, { data: receivedRows, error: receivedError }, { data: givenRows, error: givenError }, unreadNotifications] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, receiver_user_id, card:card_library(title, category, qr_slug)")
      .eq("receiver_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, receiver_user_id, card:card_library(title, category, qr_slug)")
      .eq("giver_user_id", user.id)
      .order("created_at", { ascending: false }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (receivedError || givenError) throw new Error(t("errLoadCards"));

  const allRows = [...((receivedRows ?? []) as RecognitionRow[]), ...((givenRows ?? []) as RecognitionRow[])];
  const userIds = Array.from(new Set(allRows.flatMap((row) => [row.giver_user_id, row.receiver_user_id]).filter((value): value is string => Boolean(value))));
  const { data: people } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", userIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const peopleMap = new Map((people ?? []).map((person) => [person.id, `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || tc("gethUser")]));

  const received: RecognitionItem[] = ((receivedRows ?? []) as RecognitionRow[]).flatMap((row) => {
    const card = cardFromRow(row);
    if (!card) return [];
    return [{
      id: row.id,
      from: row.giver_user_id ? peopleMap.get(row.giver_user_id) ?? tc("colleague") : row.giver_name ?? row.giver_email ?? tc("colleague"),
      card: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
      category: card.category,
      note: row.personal_note ?? tc("noPersonalNote"),
      date: displayDate(row.created_at, locale),
      createdAt: row.created_at
    }];
  });

  const given: RecognitionItem[] = ((givenRows ?? []) as RecognitionRow[]).flatMap((row) => {
    const card = cardFromRow(row);
    if (!card) return [];
    return [{
      id: row.id,
      from: t("toName", { name: peopleMap.get(row.receiver_user_id) ?? tc("teammate") }),
      card: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
      category: card.category,
      note: row.personal_note ?? tc("noPersonalNote"),
      date: displayDate(row.created_at, locale),
      createdAt: row.created_at
    }];
  });

  return (
    <DashboardShell
      role="employee"
      title={t("cardsTitle")}
      subtitle={t("cardsSubtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || tc("gethUser"),
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? tc("noTeam"),
        imageUrl: profile.profile_image
      }}
      actions={
        <>
          <Link className="btn btn-primary" href={`/${locale}/employee/scan`}><QrCode size={16} /> {t("scanCard")}</Link>
          <Link className="btn btn-dark" href={`/${locale}/cards`}>{tc("browseCards")}</Link>
        </>
      }
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("receivedTitle")}</h2>
            <span className="quality-pill">{t("countReceived", { count: received.length })}</span>
          </div>
          {received.length ? <RecognitionList items={received} /> : <EmptyState title={t("receivedEmptyTitle")} copy={t("receivedEmptyCopy")} />}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("givenTitle")}</h2>
            <span className="quality-pill">{t("countSent", { count: given.length })}</span>
          </div>
          {given.length ? <RecognitionList items={given} compact /> : <EmptyState title={t("givenEmptyTitle")} copy={t("givenEmptyCopy")} actionLabel={tc("openCardLibrary")} actionHref={`/${locale}/cards`} />}
        </article>
      </section>
    </DashboardShell>
  );
}
