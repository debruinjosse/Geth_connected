import { NextRequest } from "next/server";
import { createFinalReviewIcs, getFinalReviewMeetingDetails } from "@/lib/calendar/final-review";
import { sendCalendarInviteEmail } from "@/lib/mail/nodemailer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseRecipients(value: unknown) {
  const explicit = typeof value === "string" ? value : "";
  const source = explicit || process.env.GETH_REVIEW_MEETING_ATTENDEES || "";
  return source
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    return Response.json({ ok: false, message: "Only platform admins can send the review calendar invite." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { to?: string };
  const recipients = parseRecipients(body.to);

  if (!recipients.length) {
    return Response.json({ ok: false, message: "No valid recipients. Set GETH_REVIEW_MEETING_ATTENDEES or POST { to }." }, { status: 400 });
  }

  const ics = createFinalReviewIcs(request.nextUrl.origin);
  const meeting = getFinalReviewMeetingDetails(request.nextUrl.origin);
  const subject = meeting.title;
  const text = `Calendar invite attached.\n\n${meeting.title}\n${meeting.start.toUTCString()} - ${meeting.end.toUTCString()}\nLocation: ${meeting.location}\n\n${meeting.description}`;

  await Promise.all(
    recipients.map((to) =>
      sendCalendarInviteEmail({
        to,
        subject,
        text,
        ics
      })
    )
  );

  return Response.json({ ok: true, sent: recipients.length });
}
