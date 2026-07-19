function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIcsDate(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export type DemoBookingCalendarDetails = {
  id: string;
  name: string;
  email: string;
  company: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  timezone?: string | null;
  durationMinutes?: number | null;
  adminNote?: string | null;
};

function getStartDate(details: DemoBookingCalendarDetails) {
  if (!details.preferredDate || !details.preferredTime) return null;

  const date = new Date(`${details.preferredDate}T${details.preferredTime}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createDemoBookingIcs(details: DemoBookingCalendarDetails) {
  const start = getStartDate(details) ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const duration = details.durationMinutes && Number.isFinite(details.durationMinutes) ? details.durationMinutes : 30;
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const created = toIcsDate(new Date());
  const uid = `geth-demo-${details.id}@geth-connected`;
  const timezone = details.timezone ? `Preferred timezone: ${details.timezone}` : "Preferred timezone: not provided";
  const adminNote = details.adminNote ? `\\nAdmin note: ${escapeIcs(details.adminNote)}` : "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GETH//Demo Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${created}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(`GETH demo with ${details.company}`)}`,
    `DESCRIPTION:${escapeIcs(`Demo requester: ${details.name} <${details.email}>\\nCompany: ${details.company}\\n${timezone}${adminNote}`)}`,
    "LOCATION:Online",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
