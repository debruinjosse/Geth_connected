import { redirect } from "next/navigation";
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

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function getMinimumScheduleDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminDemoBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title="Demo bookings" subtitle="Connect Supabase to review booking requests." user={{ name: "GETH Admin", initials: "GA", team: "GETH Platform" }}>
        <EmptyState title="Supabase is not configured" copy="Demo bookings require Supabase so requests can be stored and reviewed." />
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
      .order("created_at", { ascending: false })
      .limit(50),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  return (
    <DashboardShell
      role="admin"
      title="Demo bookings"
      subtitle="Approve or decline incoming demo requests and send the customer a calendar update."
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: "GETH Platform"
      }}
      actions={<span className="quality-pill">Admin approval</span>}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Incoming demo requests</h2>
            <p>Use Yes to confirm a slot or No to ask for another time.</p>
          </div>
          <CalendarCheck2 size={22} />
        </div>

        {error ? (
          <EmptyState title="Demo booking table is not ready" copy="Run the Supabase migration 011_demo_bookings.sql, then reload this page." />
        ) : bookings?.length ? (
          <div className="demo-booking-list">
            {(bookings as DemoBooking[]).map((booking) => {
              const isApproved = booking.status === "approved";
              const isRescheduled = booking.status === "rescheduled";

              return (
                <section className="demo-booking-card" key={booking.id}>
                  <div>
                    <span className={`quality-pill status-${booking.status}`}>{isApproved ? "Approved" : isRescheduled ? "Rescheduled" : booking.status}</span>
                    <h3>{booking.company}</h3>
                    <p>
                      {booking.name} - {booking.email}
                    </p>
                    <p>
                      {formatDate(booking.preferred_date)} at {booking.preferred_time ?? "time not selected"} {booking.timezone ? `(${booking.timezone})` : ""}
                    </p>
                    <p>
                      {booking.role ?? "Role not provided"} - {booking.team_size ?? "Team size not provided"} - {booking.duration_minutes ?? 30} minutes
                    </p>
                    {booking.message ? <p className="section-copy">{booking.message}</p> : null}
                  </div>
                  {isApproved ? (
                    <div className="demo-booking-approved">
                      <strong>Approved</strong>
                      <p>The customer has been sent a confirmation email with a calendar attachment.</p>
                      {booking.admin_note ? <small>Note: {booking.admin_note}</small> : null}
                    </div>
                  ) : (
                    <div className="demo-booking-actions">
                      <form action={updateDemoBookingStatusAction}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <textarea className="input" name="adminNote" placeholder="Optional note for the customer" defaultValue={booking.admin_note ?? ""} />
                        <button className="btn btn-primary compact" type="submit" name="status" value="approved">
                          Yes, confirm
                        </button>
                      </form>
                      <details className="demo-reschedule-panel">
                        <summary>No, reschedule</summary>
                        <form action={updateDemoBookingStatusAction} className="demo-reschedule-form">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="status" value="rescheduled" />
                          <div className="form-grid">
                            <div className="form-field">
                              <label htmlFor={`reschedule-date-${booking.id}`}>New date</label>
                              <input id={`reschedule-date-${booking.id}`} className="input" name="rescheduleDate" type="date" min={getMinimumScheduleDate()} defaultValue={booking.preferred_date ?? ""} required />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`reschedule-time-${booking.id}`}>New time</label>
                              <input id={`reschedule-time-${booking.id}`} className="input" name="rescheduleTime" type="time" defaultValue={booking.preferred_time ?? ""} required />
                            </div>
                            <div className="form-field">
                              <label htmlFor={`reschedule-duration-${booking.id}`}>Duration</label>
                              <select id={`reschedule-duration-${booking.id}`} className="input" name="rescheduleDuration" defaultValue={String(booking.duration_minutes ?? 30)}>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                              </select>
                            </div>
                          </div>
                          <textarea className="input" name="adminNote" placeholder="Add a reschedule note for the customer" defaultValue={booking.admin_note ?? ""} />
                          <button className="btn btn-secondary compact" type="submit">
                            Send reschedule
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
          <EmptyState title="No demo bookings yet" copy="New public book-demo submissions will appear here." />
        )}
      </article>
    </DashboardShell>
  );
}
