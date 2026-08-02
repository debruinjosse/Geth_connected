"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createDemoBookingIcs } from "@/lib/calendar/demo-booking";
import { sendDemoBookingDecisionEmail, sendDemoBookingRequestEmails } from "@/lib/mail/nodemailer";
import { isAppLocale, type AppLocale } from "@/i18n/routing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DemoBookingState = {
  ok: boolean;
  message: string;
};

type DemoBookingRow = {
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
  locale: string | null;
};

const initialState: DemoBookingState = {
  ok: false,
  message: ""
};

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getBookingLocale(raw: string): AppLocale {
  return isAppLocale(raw) ? raw : "en";
}

function getAdminEmails() {
  const configured = process.env.DEMO_BOOKING_ADMIN_EMAILS || process.env.BOOK_DEMO_ADMIN_EMAILS || process.env.SMTP_REPLY_TO || process.env.SMTP_USER || "";
  return configured
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function getAppOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function formatPreferredSlot(
  date: string,
  time: string,
  timezone: string,
  t: Awaited<ReturnType<typeof getTranslations<"bookDemoPage">>>
) {
  return t("preferredSlot", { date, time, timezone });
}

export async function createDemoBookingAction(_previousState: DemoBookingState = initialState, formData: FormData): Promise<DemoBookingState> {
  const locale = getBookingLocale(getValue(formData, "locale"));
  const t = await getTranslations({ locale, namespace: "bookDemoPage" });

  const name = getValue(formData, "name");
  const email = getValue(formData, "email");
  const company = getValue(formData, "company");
  const teamSize = getValue(formData, "teamSize");
  const role = getValue(formData, "role");
  const preferredDate = getValue(formData, "preferredDate");
  const preferredTime = getValue(formData, "preferredTime");
  const timezone = getValue(formData, "timezone");
  const durationMinutes = Number(getValue(formData, "durationMinutes") || 30);
  const message = getValue(formData, "message");
  const adminEmails = getAdminEmails();

  if (!name || !email || !company || !teamSize || !role || !preferredDate || !preferredTime || !timezone || !message) {
    return { ok: false, message: t("errorIncomplete") };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: t("errorInvalidEmail") };
  }

  if (!Number.isFinite(durationMinutes) || ![30, 45, 60].includes(durationMinutes)) {
    return { ok: false, message: t("errorInvalidDuration") };
  }

  if (!adminEmails.length) {
    return { ok: false, message: t("errorAdminNotConfigured") };
  }

  const preferredSlot = formatPreferredSlot(preferredDate, preferredTime, timezone, t);
  const adminUrl = `${getAppOrigin().replace(/\/$/, "")}/${locale}/admin/demo-bookings`;

  const requesterText = [
    t("emailRequesterGreeting", { name }),
    "",
    t("emailRequesterThanks"),
    "",
    t("emailRequesterPreferredSlot", { slot: preferredSlot }),
    t("emailRequesterCompany", { company }),
    "",
    t("emailRequesterFooter")
  ].join("\n");

  const adminText = [
    t("emailAdminTitle"),
    "",
    t("emailAdminName", { name }),
    t("emailAdminEmail", { email }),
    t("emailAdminCompany", { company }),
    t("emailAdminTeamSize", { teamSize }),
    t("emailAdminRole", { role }),
    t("emailAdminPreferredSlot", { slot: preferredSlot }),
    "",
    t("emailAdminMessage", { message: message || t("emailAdminNoMessage") }),
    "",
    t("emailAdminApprove", { url: adminUrl })
  ].join("\n");

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("demo_bookings")
      .insert({
        name,
        email,
        company,
        team_size: teamSize,
        role,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        timezone,
        duration_minutes: durationMinutes,
        message,
        locale,
        status: "pending"
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      throw new Error(error?.message || t("errorCouldNotSave"));
    }

    await sendDemoBookingRequestEmails({
      adminEmails,
      requesterEmail: email,
      requesterSubject: t("emailRequesterSubject"),
      requesterText,
      adminSubject: t("emailAdminSubject", { company }),
      adminText
    });

    revalidatePath("/admin/demo-bookings");
    return { ok: true, message: t("successMessage", { email }) };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : t("errorCouldNotSubmit");
    return { ok: false, message: messageText };
  }
}

async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in as owner/admin.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (!profile || !["super_admin", "platform_admin"].includes(profile.role)) {
    throw new Error("Only owner/admin can update demo bookings.");
  }

  return user.id;
}

export async function updateDemoBookingStatusAction(formData: FormData) {
  const bookingId = getValue(formData, "bookingId");
  const status = getValue(formData, "status") as "approved" | "declined" | "rescheduled";
  const adminNote = getValue(formData, "adminNote");
  const rescheduleDate = getValue(formData, "rescheduleDate");
  const rescheduleTime = getValue(formData, "rescheduleTime");
  const rescheduleDuration = Number(getValue(formData, "rescheduleDuration") || 30);

  if (!bookingId || !["approved", "declined", "rescheduled"].includes(status)) {
    throw new Error("Invalid demo booking update.");
  }

  if (status === "rescheduled" && (!rescheduleDate || !rescheduleTime || ![30, 45, 60].includes(rescheduleDuration))) {
    throw new Error("Choose a valid date, time, and duration before rescheduling.");
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createSupabaseAdminClient();
  const { data: booking, error: readError } = await supabase
    .from("demo_bookings")
    .select("id, name, email, company, team_size, role, preferred_date, preferred_time, timezone, duration_minutes, message, locale")
    .eq("id", bookingId)
    .single<DemoBookingRow>();

  if (readError || !booking) {
    throw new Error(readError?.message || "Demo booking was not found.");
  }

  const locale = getBookingLocale(booking.locale ?? "en");
  const t = await getTranslations({ locale, namespace: "bookDemoPage" });

  const { error } = await supabase
    .from("demo_bookings")
    .update({
      status,
      preferred_date: status === "rescheduled" ? rescheduleDate : booking.preferred_date,
      preferred_time: status === "rescheduled" ? rescheduleTime : booking.preferred_time,
      duration_minutes: status === "rescheduled" ? rescheduleDuration : booking.duration_minutes,
      admin_note: adminNote || null,
      decided_by: adminUserId,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  const slotDate = status === "rescheduled" ? rescheduleDate : booking.preferred_date ?? "";
  const slotTime = status === "rescheduled" ? rescheduleTime : booking.preferred_time ?? "";
  const preferredSlot = formatPreferredSlot(slotDate, slotTime, booking.timezone ?? "", t);
  const ics =
    status === "approved" || status === "rescheduled"
      ? createDemoBookingIcs({
          id: booking.id,
          name: booking.name,
          email: booking.email,
          company: booking.company,
          preferredDate: status === "rescheduled" ? rescheduleDate : booking.preferred_date,
          preferredTime: status === "rescheduled" ? rescheduleTime : booking.preferred_time,
          timezone: booking.timezone,
          durationMinutes: status === "rescheduled" ? rescheduleDuration : booking.duration_minutes,
          adminNote
        })
      : undefined;

  const approved = status === "approved";
  const rescheduled = status === "rescheduled";
  const decisionText = [
    t("emailRequesterGreeting", { name: booking.name }),
    "",
    approved
      ? t("emailDecisionApproved", { company: booking.company })
      : rescheduled
        ? t("emailDecisionRescheduled", { company: booking.company })
        : t("emailDecisionDeclined", { company: booking.company }),
    rescheduled
      ? t("emailDecisionNewSlot", { slot: preferredSlot })
      : t("emailDecisionRequestedSlot", { slot: preferredSlot }),
    adminNote ? t("emailDecisionNote", { note: adminNote }) : "",
    "",
    approved || rescheduled ? t("emailDecisionCalendar") : t("emailDecisionReply")
  ].filter(Boolean).join("\n");

  const decisionSubject = approved
    ? t("emailDecisionSubjectApproved")
    : rescheduled
      ? t("emailDecisionSubjectRescheduled")
      : t("emailDecisionSubjectDeclined");

  await sendDemoBookingDecisionEmail({
    to: booking.email,
    subject: decisionSubject,
    text: decisionText,
    ics
  });

  revalidatePath("/admin/demo-bookings");
}
