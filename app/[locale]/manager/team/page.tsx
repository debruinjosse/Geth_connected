import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sendManagerNoteAction } from "@/app/actions/managerNotes";
import { localizedLoginPath } from "@/lib/auth/paths";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { TeamTable } from "@/components/TeamTable";
import { localizeDemoPeople } from "@/lib/localize-demo-content";
import { managerUser, people } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { Field, Select, Textarea } from "@/components/ui/Fields";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

export default async function ManagerTeamPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ note?: string }>;
}) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "manager" });

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title={tp("teamTitle")} subtitle={tp("teamSubtitle")} user={managerUser} actions={<Pill>{tc("demoFallback")}</Pill>}>
        <Panel><TeamTable people={localizeDemoPeople(people, locale)} /></Panel>
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect(localizedLoginPath(locale, `/${locale}/manager/team`));

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id, tm, locale);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect("/auth/repair-profile");
    console.error("manager team insights failed", error);
    return (
      <DashboardShell
        role="manager"
        title={tp("teamTitle")}
        subtitle={tp("teamSubtitle")}
        user={{
          name: tc("managerRole"),
          initials: "MG",
          team: tc("noTeam")
        }}
        unreadNotifications={0}
      >
        <EmptyState title={tp("insightsErrorTitle")} copy={tp("insightsErrorCopy")} />
      </DashboardShell>
    );
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  const { data: sentNotes } = await supabase
    .from("manager_notes")
    .select("id, body, created_at, recipient:profiles!manager_notes_recipient_user_id_fkey(first_name, last_name)")
    .eq("manager_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const dateLocale = locale === "nl" ? "nl-NL" : "en";
  const formatNoteDate = (value: string) =>
    new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <DashboardShell
      role="manager"
      title={tp("teamTitle")}
      subtitle={tp("teamSubtitle")}
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || tc("managerRole"),
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel
      }}
      actions={<Pill>{insights.teamRows.length} members</Pill>}
      unreadNotifications={unreadNotifications}
    >
      <Panel>
        {insights.teamRows.length ? (
          <TeamTable people={insights.teamRows} />
        ) : (
          <EmptyState title={tp("noMembersTitle")} copy={tp("noMembersCopy")} />
        )}
      </Panel>
      {insights.teamRows.length ? (
        <Grid cols="two">
          <Panel title={tp("noteTitle")} description={tp("noteCopy")}>
            <div className="lp-stack" style={{ gap: 14, marginBottom: queryParams.note ? 20 : 0 }}>
              {queryParams.note === "sent" ? <Alert tone="success">{tp("noteSent")}</Alert> : null}
              {queryParams.note === "error" ? <Alert tone="error">{tp("noteError")}</Alert> : null}
              {queryParams.note === "not_allowed" ? <Alert tone="error">{tp("noteNotAllowed")}</Alert> : null}
            </div>
            <form className="lp-form" action={sendManagerNoteAction}>
              <input type="hidden" name="return_to" value={`/${locale}/manager/team`} />
              <Field label={tp("employee")} htmlFor="note-recipient">
                <Select id="note-recipient" name="recipient_id" required defaultValue="">
                  <option value="">{tp("chooseEmployee")}</option>
                  {insights.teamRows.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.name} - {member.team}
                    </option>
                  ))}
                </Select>
              </Field>
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

          <Panel title={tp("sentNotesTitle")} description={tp("sentNotesCopy")}>
            {sentNotes?.length ? (
              <Feed>
                {sentNotes.map((note) => {
                  const recipient = Array.isArray(note.recipient) ? note.recipient[0] : note.recipient;
                  const recipientName = `${recipient?.first_name ?? ""} ${recipient?.last_name ?? ""}`.trim() || tp("employee");

                  return <FeedItem key={note.id} avatar={recipientName} title={recipientName} note={note.body} metaSub={formatNoteDate(note.created_at)} />;
                })}
              </Feed>
            ) : (
              <EmptyState title={tp("sentNotesEmptyTitle")} copy={tp("sentNotesEmptyCopy")} />
            )}
          </Panel>
        </Grid>
      ) : null}
    </DashboardShell>
  );
}
