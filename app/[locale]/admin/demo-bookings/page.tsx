import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarCheck2 } from "lucide-react";
import { updateDemoBookingStatusAction } from "@/app/actions/demoBookings";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      actions={<span className="quality-pill">{t("adminApprovalPill")}</span>}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("incomingDemoRequestsTitle")}</h2>
            <p>{t("incomingDemoRequestsCopy")}</p>
          </div>
          <CalendarCheck2 size={22} />
        </div>

        {error ? (
          <EmptyState title={t("demoTableNotReadyTitle")} copy={t("demoTableNotReadyCopy")} />
        ) : bookings?.length ? (
          <div className="demo-booking-list">
            {(bookings as DemoBooking[]).map((booking) => {
              const isApproved = booking.status === "approved";
              const isRescheduled = booking.status === "rescheduled";

              return (
                <section className="demo-booking-card" key={booking.id}>
                  <div>
                    <span className={`quality-pill status-${booking.status}`}>{isApproved ? t("statusApproved") : isRescheduled ? t("statusRescheduled") : booking.status}</span>
                    <h3>{booking.company}</h3>
                    <p>
                      {booking.name} - {booking.email}
                    </p>
                    <p>
                      {formatDate(booking.preferred_date, t("noDate"), dateLocale)} at {booking.preferred_time ?? t("timeNotSelected")} {booking.timezone ? `(${booking.timezone})` : ""}
                    </p>
                    <p>
                      {booking.role ?? t("roleNotProvided")} - {booking.team_size ?? t("teamSizeNotProvided")} - {t("minutesUnit", { count: booking.duration_minutes ?? 30 })}
                    </p>
                    {booking.message ? <p className="section-copy">{booking.message}</p> : null}
                  </div>
                  {isApproved ? (
                    <div className="demo-booking-approved">
                      <strong>{t("approvedConfirmationTitle")}</strong>
                      <p>{t("approvedConfirmationCopy")}</p>
                      {booking.admin_note ? <small>{t("notePrefix", { note: booking.admin_note })}</small> : null}
                    </div>
                  ) : (
                    <div className="demo-booking-actions">
                      <form action={updateDemoBookingStatusAction}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <textarea className="input" name="adminNote" placeholder={t("optionalNotePlaceholder")} defaultValue={booking.admin_note ?? ""} />
                        <button className="btn btn-primary compact" type="submit" name="status" value="approved">
                          {t("yesConfirmButton")}
                        </button>
                      </form>
                      <details className="demo-reschedule-panel">
                        <summary>{t("noRescheduleButton")}</summary>
                        <form action={updateDemoBookingStatusAction} className="demo-reschedule-form">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="status" value="rescheduled" />
                          <div className="form-grid">
                            <div className="form-field">
                              <label htmlFor={`reschedule-date-${booking.id}`}>{t("newDateLabel")}</label>
                              <input id={`reschedule-date-${booking.id}`} className="input" name="rescheduleDate" type="date" min={getMinimumScheduleDate()} defaultValue={booking.preferred_date ?? ""} required />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`reschedule-time-${booking.id}`}>{t("newTimeLabel")}</label>
                              <input id={`reschedule-time-${booking.id}`} className="input" name="rescheduleTime" type="time" defaultValue={booking.preferred_time ?? ""} required />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`reschedule-duration-${booking.id}`}>{t("durationLabel")}</label>
                              <select id={`reschedule-duration-${booking.id}`} className="input" name="rescheduleDuration" defaultValue={String(booking.duration_minutes ?? 30)}>
                                <option value="30">{t("duration30")}</option>
                                <option value="45">{t("duration45")}</option>
                                <option value="60">{t("duration60")}</option>
                              </select>
                            </div>
                          </div>
                          <textarea className="input" name="adminNote" placeholder={t("rescheduleNotePlaceholder")} defaultValue={booking.admin_note ?? ""} />
                          <button className="btn btn-secondary compact" type="submit">
                            {t("sendRescheduleButton")}
                          </button>
                        </form>
                      </details>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t("emptyNoDemoBookingsTitle")} copy={t("emptyNoDemoBookingsCopy")} />
        )}
      </article>
    </DashboardShell>
  );
}
