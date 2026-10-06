import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarCheck2 } from "lucide-react";
import { updateDemoBookingStatusAction } from "@/app/actions/demoBookings";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminRescheduleButton } from "@/components/AdminRescheduleButton";

type DemoBooking = {
  id: string;
  name: string;
  email: string;
  company: string;
  team_size: string | null;
  role: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  timezone: string | null;
  duration_minutes: number | null;
  message: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

function formatDate(value: string | null, noDateLabel: string, dateLocale: string) {
  if (!value) return noDateLabel;
  return new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function getMinimumScheduleDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminDemoBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const dateLocale = locale === "nl" ? "nl-NL" : "en";

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title={t("demoBookingsTitle")} subtitle={t("demoBookingsNoSupabaseSubtitle")} user={{ name: tc("platformAdminName"), initials: "GA", team: tc("platformTeam") }}>
        <EmptyState title={t("cardsLibraryNoSupabaseTitle")} copy={t("demoBookingsNoSupabaseCopy")} />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; role: string }>();

  if (!profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const [{ data: bookings, error }, unreadNotifications] = await Promise.all([
    supabase
      .from("demo_bookings")
      .select("id, name, email, company, team_size, role, preferred_date, preferred_time, timezone, duration_minutes, message, status, admin_note, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  return (
    <DashboardShell
      role="admin"
      title={t("demoBookingsTitle")}
      subtitle={t("demoBookingsSubtitle")}
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      actions={<Pill>{t("adminApprovalPill")}</Pill>}
      unreadNotifications={unreadNotifications}
    >
      <Panel title={t("incomingDemoRequestsTitle")} description={t("incomingDemoRequestsCopy")} action={<><CalendarCheck2 size={22} /></>}>

        {error ? (
          <EmptyState title={t("demoTableNotReadyTitle")} copy={t("demoTableNotReadyCopy")} />
        ) : bookings?.length ? (
          <div className="lp-booking-list">
            {(bookings as DemoBooking[]).map((booking) => {
              const isApproved = booking.status === "approved";
              const isRescheduled = booking.status === "rescheduled";

              return (
                <section className="lp-booking" key={booking.id}>
                  <div className="lp-booking-info">
                    <div className="lp-booking-head">
                      <h3>{booking.company}</h3>
                      <StatusPill raw={booking.status}>{isApproved ? t("statusApproved") : isRescheduled ? t("statusRescheduled") : booking.status}</StatusPill>
                    </div>
                    <p>{booking.name} · {booking.email}</p>
                    <p>
                      {formatDate(booking.preferred_date, t("noDate"), dateLocale)} · {booking.preferred_time ?? t("timeNotSelected")} {booking.timezone ? `(${booking.timezone})` : ""}
                    </p>
                    <p>
                      {booking.role ?? t("roleNotProvided")} · {booking.team_size ?? t("teamSizeNotProvided")} · {t("minutesUnit", { count: booking.duration_minutes ?? 30 })}
                    </p>
                    {booking.message ? <p className="lp-booking-msg">{booking.message}</p> : null}
                  </div>
                  {isApproved ? (
                    <Alert tone="success" title={t("approvedConfirmationTitle")}>
                      {t("approvedConfirmationCopy")}
                      {booking.admin_note ? <small className="lp-cell-sub">{t("notePrefix", { note: booking.admin_note })}</small> : null}
                    </Alert>
                  ) : (
                    <form action={updateDemoBookingStatusAction} className="lp-booking-actions">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <Textarea name="adminNote" rows={2} aria-label={t("optionalNotePlaceholder")} placeholder={t("optionalNotePlaceholder")} defaultValue={booking.admin_note ?? ""} />
                      <div className="lp-row-actions">
                        <Button size="sm" type="submit" name="status" value="approved">
                          {t("yesConfirmButton")}
                        </Button>
                        <AdminRescheduleButton
                          bookingId={booking.id}
                          minDate={getMinimumScheduleDate()}
                          defaults={{ date: booking.preferred_date ?? "", time: booking.preferred_time ?? "", duration: String(booking.duration_minutes ?? 30), note: booking.admin_note ?? "" }}
                          labels={{
                            open: t("noRescheduleButton"),
                            newDate: t("newDateLabel"),
                            newTime: t("newTimeLabel"),
                            duration: t("durationLabel"),
                            duration30: t("duration30"),
                            duration45: t("duration45"),
                            duration60: t("duration60"),
                            notePlaceholder: t("rescheduleNotePlaceholder"),
                            send: t("sendRescheduleButton")
                          }}
                        />
                      </div>
                    </form>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t("emptyNoDemoBookingsTitle")} copy={t("emptyNoDemoBookingsCopy")} />
        )}
      </Panel>
    </DashboardShell>
  );
}
