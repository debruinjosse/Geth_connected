import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sendManagerNoteAction } from "@/app/actions/managerNotes";
import { localizedLoginPath } from "@/lib/auth/paths";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { Field, Input, Select, Textarea } from "@/components/ui/Fields";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Manager messages: every note the manager sent, filterable by employee and date range
 * (GET form → `?employee=&from=&to=`), plus the compose form.
 */
export default async function ManagerMessagesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ employee?: string; from?: string; to?: string; note?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "manager" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect(localizedLoginPath(locale, `/${locale}/manager/messages`));

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id, tm, locale);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect("/auth/repair-profile");
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  const members = insights.teamRows.filter((member) => member.id !== user.id);
  const memberIds = new Set(members.map((member) => member.id));
  const employeeFilter = query.employee && memberIds.has(query.employee) ? query.employee : "";
  const from = query.from && ISO_DATE.test(query.from) ? query.from : "";
  const to = query.to && ISO_DATE.test(query.to) ? query.to : "";

  let notesQuery = supabase
    .from("manager_notes")
    .select("id, body, created_at, recipient_user_id, recipient:profiles!manager_notes_recipient_user_id_fkey(first_name, last_name)")
    .eq("manager_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (employeeFilter) notesQuery = notesQuery.eq("recipient_user_id", employeeFilter);
  if (from) notesQuery = notesQuery.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) notesQuery = notesQuery.lte("created_at", `${to}T23:59:59.999Z`);
  const { data: notes } = await notesQuery;

  const dateLocale = locale === "nl" ? "nl-NL" : "en";
  const formatNoteDate = (value: string) =>
    new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const hasFilters = Boolean(employeeFilter || from || to);

  return (
    <DashboardShell
      role="manager"
      title={tp("messagesTitle")}
      subtitle={tp("messagesSubtitle")}
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || tc("managerRole"),
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel
      }}
      actions={<Pill>{tp("messagesCount", { count: notes?.length ?? 0 })}</Pill>}
      unreadNotifications={unreadNotifications}
    >
      {query.note === "sent" ? <Alert tone="success">{tp("noteSent")}</Alert> : null}
      {query.note === "error" ? <Alert tone="error">{tp("noteError")}</Alert> : null}
      {query.note === "not_allowed" ? <Alert tone="error">{tp("noteNotAllowed")}</Alert> : null}

      <Panel title={tp("filterTitle")}>
        <form className="lp-form" method="get">
          <Grid cols="two">
            <Field label={tp("employee")} htmlFor="msg-employee">
              <Select id="msg-employee" name="employee" defaultValue={employeeFilter}>
                <option value="">{tp("allEmployees")}</option>
                {members.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="lp-stack" style={{ gap: 14 }}>
              <Field label={tp("fromDate")} htmlFor="msg-from">
                <Input id="msg-from" type="date" name="from" defaultValue={from} />
              </Field>
              <Field label={tp("toDate")} htmlFor="msg-to">
                <Input id="msg-to" type="date" name="to" defaultValue={to} />
              </Field>
            </div>
          </Grid>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button type="submit">{tp("applyFilters")}</Button>
            {hasFilters ? (
              <Button variant="ghost" href={`/${locale}/manager/messages`}>
                {tp("clearFilters")}
              </Button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Grid cols="two">
        <Panel title={tp("sentNotesTitle")} description={tp("sentNotesCopy")}>
          {notes?.length ? (
            <Feed>
              {notes.map((note) => {
                const recipient = Array.isArray(note.recipient) ? note.recipient[0] : note.recipient;
                const recipientName = `${recipient?.first_name ?? ""} ${recipient?.last_name ?? ""}`.trim() || tp("employee");
                return <FeedItem key={note.id} avatar={recipientName} title={recipientName} note={note.body} metaSub={formatNoteDate(note.created_at)} />;
              })}
            </Feed>
          ) : (
            <EmptyState title={hasFilters ? tp("messagesNoMatchTitle") : tp("sentNotesEmptyTitle")} copy={hasFilters ? tp("messagesNoMatchCopy") : tp("sentNotesEmptyCopy")} />
          )}
        </Panel>

        <Panel title={tp("noteTitle")} description={tp("noteCopy")}>
          {members.length ? (
            <form className="lp-form" action={sendManagerNoteAction}>
              <input type="hidden" name="return_to" value={`/${locale}/manager/messages`} />
              <Field label={tp("employee")} htmlFor="note-recipient">
                <Select id="note-recipient" name="recipient_id" required defaultValue={employeeFilter}>
                  <option value="">{tp("chooseEmployee")}</option>
                  {members.map((member) => (
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
          ) : (
            <EmptyState title={tp("noMembersTitle")} copy={tp("noMembersCopy")} />
          )}
        </Panel>
      </Grid>
    </DashboardShell>
  );
}
