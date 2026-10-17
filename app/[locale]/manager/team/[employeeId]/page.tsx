import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sendManagerNoteAction } from "@/app/actions/managerNotes";
import { localizedLoginPath } from "@/lib/auth/paths";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { getLocalizedCardTitle } from "@/lib/cards";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { Field, Textarea } from "@/components/ui/Fields";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

type RecognitionRow = {
  id: string;
  created_at: string;
  personal_note: string | null;
  giver_name: string | null;
  giver_user_id: string | null;
  receiver_user_id: string;
  card: { title: string; category: string; qr_slug?: string | null } | Array<{ title: string; category: string; qr_slug?: string | null }> | null;
};

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

/** Everything a manager needs about one team member: cards received, cards given, and messages sent to them. */
export default async function ManagerEmployeeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; employeeId: string }>;
  searchParams: Promise<{ note?: string }>;
}) {
  const [{ locale, employeeId }, query] = await Promise.all([params, searchParams]);
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "manager" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect(localizedLoginPath(locale, `/${locale}/manager/team/${employeeId}`));

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id, tm, locale);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect("/auth/repair-profile");
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);
  const shellUser = {
    name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || tc("managerRole"),
    initials: getInitials(insights.profile.first_name, insights.profile.last_name),
    team: insights.teamLabel
  };

  // Only people inside the manager's own scope may be opened (the same list the team page shows).
  const member = insights.teamRows.find((row) => row.id === employeeId);
  if (!member) {
    return (
      <DashboardShell role="manager" title={tp("detailNotFoundTitle")} subtitle={tp("detailSubtitle")} user={shellUser} unreadNotifications={unreadNotifications}>
        <EmptyState title={tp("detailNotFoundTitle")} copy={tp("detailNotFoundCopy")} actionLabel={tp("detailBack")} actionHref={`/${locale}/manager/team`} />
      </DashboardShell>
    );
  }

  const cardSelect = "id, created_at, personal_note, giver_name, giver_user_id, receiver_user_id, card:card_library(title, category, qr_slug)";
  const [{ data: receivedRows }, { data: givenRows }, { data: notes }] = await Promise.all([
    supabase.from("recognition_events").select(cardSelect).eq("receiver_user_id", employeeId).order("created_at", { ascending: false }).limit(100),
    supabase.from("recognition_events").select(cardSelect).eq("giver_user_id", employeeId).order("created_at", { ascending: false }).limit(100),
    supabase
      .from("manager_notes")
      .select("id, body, created_at")
      .eq("manager_user_id", user.id)
      .eq("recipient_user_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const allRows = [...((receivedRows ?? []) as RecognitionRow[]), ...((givenRows ?? []) as RecognitionRow[])];
  const personIds = Array.from(new Set(allRows.flatMap((row) => [row.giver_user_id, row.receiver_user_id]).filter((value): value is string => Boolean(value))));
  const { data: people } = personIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", personIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const nameOf = new Map((people ?? []).map((person) => [person.id, `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || tc("colleague")]));

  const dateLocale = locale === "nl" ? "nl-NL" : "en";
  const formatDateTime = (value: string) => new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  const toItem = (row: RecognitionRow, direction: "received" | "given"): RecognitionItem[] => {
    const card = Array.isArray(row.card) ? row.card[0] : row.card;
    if (!card) return [];
    const counterpart =
      direction === "received"
        ? tp("detailFromName", { name: row.giver_user_id ? nameOf.get(row.giver_user_id) ?? tc("colleague") : row.giver_name ?? tc("colleague") })
        : tp("detailToName", { name: nameOf.get(row.receiver_user_id) ?? tc("teammate") });
    return [
      {
        id: `${direction}-${row.id}`,
        from: counterpart,
        card: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
        category: card.category,
        note: row.personal_note ?? tc("noPersonalNote"),
        date: formatDateTime(row.created_at),
        createdAt: row.created_at
      }
    ];
  };

  const received = ((receivedRows ?? []) as RecognitionRow[]).flatMap((row) => toItem(row, "received"));
  const given = ((givenRows ?? []) as RecognitionRow[]).flatMap((row) => toItem(row, "given"));
  const isSelf = employeeId === user.id;

  return (
    <DashboardShell
      role="manager"
      title={member.name}
      subtitle={tp("detailSubtitle")}
      user={shellUser}
      actions={
        <Button variant="ghost" size="sm" href={`/${locale}/manager/team`}>
          {tp("detailBack")}
        </Button>
      }
      unreadNotifications={unreadNotifications}
    >
      <Panel>
        <div className="lp-person" style={{ gap: 16, flexWrap: "wrap" }}>
          <Avatar name={member.name} size="lg" />
          <span>
            <b>{member.name}</b>
            <small>{member.team}</small>
          </span>
          <Pill>{tp("detailReceivedTitle")}: {member.cardsReceived}</Pill>
          <Pill>{tp("detailGivenTitle")}: {member.cardsGiven}</Pill>
          <Pill tone="gold">{member.topQuality}</Pill>
        </div>
      </Panel>

      <Grid cols="two">
        <Panel title={tp("detailReceivedTitle")}>
          {received.length ? <RecognitionList items={received} /> : <EmptyState title={tp("detailReceivedEmpty")} copy="" />}
        </Panel>
        <Panel title={tp("detailGivenTitle")}>
          {given.length ? <RecognitionList items={given} /> : <EmptyState title={tp("detailGivenEmpty")} copy="" />}
        </Panel>
      </Grid>

      {!isSelf ? (
        <Grid cols="two">
          <Panel
            title={tp("detailMessagesTitle")}
            action={
              <Button variant="ghost" size="sm" href={`/${locale}/manager/messages?employee=${employeeId}`}>
                {tp("detailViewAllMessages")}
              </Button>
            }
          >
            {query.note === "sent" ? <Alert tone="success">{tp("noteSent")}</Alert> : null}
            {query.note === "error" ? <Alert tone="error">{tp("noteError")}</Alert> : null}
            {query.note === "not_allowed" ? <Alert tone="error">{tp("noteNotAllowed")}</Alert> : null}
            {notes?.length ? (
              <Feed>
                {notes.map((note) => (
                  <FeedItem key={note.id} avatar={member.name} title={member.name} note={note.body} metaSub={formatDateTime(note.created_at)} />
                ))}
              </Feed>
            ) : (
              <EmptyState title={tp("detailMessagesEmpty")} copy="" />
            )}
          </Panel>
          <Panel title={tp("noteTitle")} description={tp("noteCopy")}>
            <form className="lp-form" action={sendManagerNoteAction}>
              <input type="hidden" name="return_to" value={`/${locale}/manager/team/${employeeId}`} />
              <input type="hidden" name="recipient_id" value={employeeId} />
              <Field label={tp("note")} htmlFor="note-body">
                <Textarea id="note-body" name="note_body" rows={4} maxLength={500} placeholder={tp("notePlaceholder")} required />
              </Field>
              <div>
                <Button type="submit" arrow>
                  {tp("sendNote")}
                </Button>
              </div>
            </form>
          </Panel>
        </Grid>
      ) : null}
    </DashboardShell>
  );
}
