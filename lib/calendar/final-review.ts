function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toIcsDate(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function getNextSundayReviewStart() {
  const override = process.env.GETH_REVIEW_MEETING_START_UTC;
  if (override) {
    const date = new Date(override);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const now = new Date();
  const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday, 13, 0, 0));
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export function getFinalReviewMeetingDetails(origin: string) {
  const start = getNextSundayReviewStart();
  const durationMinutes = Number(process.env.GETH_REVIEW_MEETING_DURATION_MINUTES || 60);
  const end = new Date(start.getTime() + (Number.isFinite(durationMinutes) ? durationMinutes : 60) * 60 * 1000);

  return {
    start,
    end,
    title: process.env.GETH_REVIEW_MEETING_TITLE || "GETH Connected Cards final project review",
    location: process.env.GETH_REVIEW_MEETING_LOCATION || "Online",
    description:
      process.env.GETH_REVIEW_MEETING_DESCRIPTION ||
      "Final review for GETH Connected Cards: QR scanning, invoices, translations, dashboards, imports, and launch readiness.",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || origin
  };
}

export function createFinalReviewIcs(origin: string) {
  const meeting = getFinalReviewMeetingDetails(origin);
  const uid = `geth-final-review-${toIcsDate(meeting.start)}@geth-connected`;
  const created = toIcsDate(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GETH Connected Cards//Final Review//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${created}`,
    `DTSTART:${toIcsDate(meeting.start)}`,
    `DTEND:${toIcsDate(meeting.end)}`,
    `SUMMARY:${escapeIcs(meeting.title)}`,
    `DESCRIPTION:${escapeIcs(meeting.description)}\\n\\nProject: ${escapeIcs(meeting.appUrl)}`,
    `LOCATION:${escapeIcs(meeting.location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
