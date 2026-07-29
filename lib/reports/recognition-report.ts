import type { SupabaseClient } from "@supabase/supabase-js";
import { getCategoryDisplayName } from "@/lib/cards";

export type RecognitionReportRange = {
  from: string;
  to: string;
  fromIso: string;
  toIso: string;
};

export type RecognitionReportScope =
  | { kind: "company"; companyId: string }
  | { kind: "teams"; companyId?: string | null; teamIds: string[] };

export type RecognitionReportRow = {
  id: string;
  recognitionDate: string;
  receiver: string;
  giver: string;
  cardTitle: string;
  category: string;
  team: string;
  personalNote: string;
};

type RecognitionEventRow = {
  id: string;
  created_at: string;
  personal_note: string | null;
  giver_name: string | null;
  giver_email: string | null;
  giver_user_id: string | null;
  receiver_user_id: string;
  team_id: string | null;
  card: { title: string; category: string; card_number?: number | null; qr_slug?: string | null } | Array<{ title: string; category: string; card_number?: number | null; qr_slug?: string | null }> | null;
  team: { name: string } | Array<{ name: string }> | null;
};

type ProfileNameRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseInputDate(value: string | undefined, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : fallback;
}

function getSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getProfileDisplayName(profile: ProfileNameRow | undefined) {
  if (!profile) return "";
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return name || profile.email || "";
}

export function getRecognitionReportRange(params?: { from?: string; to?: string }): RecognitionReportRange {
  const now = new Date();
  const defaultTo = toInputDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 89);
  const defaultFrom = toInputDate(start);

  const from = parseInputDate(params?.from, defaultFrom);
  const to = parseInputDate(params?.to, defaultTo);
  const safeFrom = from <= to ? from : to;
  const safeTo = from <= to ? to : from;

  return {
    from: safeFrom,
    to: safeTo,
    fromIso: `${safeFrom}T00:00:00.000Z`,
    toIso: `${safeTo}T23:59:59.999Z`
  };
}

export async function fetchRecognitionReportRows(
  supabase: SupabaseClient,
  scope: RecognitionReportScope,
  range: RecognitionReportRange
): Promise<RecognitionReportRow[]> {
  if (scope.kind === "teams" && !scope.teamIds.length) {
    return [];
  }

  let query = supabase
    .from("recognition_events")
    .select(
      "id, created_at, personal_note, giver_name, giver_email, giver_user_id, receiver_user_id, team_id, card:card_library(title, category, card_number, qr_slug), team:teams(name)"
    )
    .gte("created_at", range.fromIso)
    .lte("created_at", range.toIso)
    .order("created_at", { ascending: false });

  if (scope.kind === "company") {
    query = query.eq("company_id", scope.companyId);
  } else {
    query = query.in("team_id", scope.teamIds);
    if (scope.companyId) {
      query = query.eq("company_id", scope.companyId);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load recognition report: ${error.message}`);
  }

  const events = (data ?? []) as RecognitionEventRow[];
  const profileIds = Array.from(
    new Set(
      events.flatMap((event) => [event.receiver_user_id, event.giver_user_id].filter(Boolean) as string[])
    )
  );

  const profileMap = new Map<string, ProfileNameRow>();
  if (profileIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", profileIds);

    if (profilesError) {
      throw new Error(`Failed to load report profile names: ${profilesError.message}`);
    }

    for (const profile of (profiles ?? []) as ProfileNameRow[]) {
      profileMap.set(profile.id, profile);
    }
  }

  return events.map((event) => {
    const card = getSingle(event.card);
    const team = getSingle(event.team);
    const receiver = getProfileDisplayName(profileMap.get(event.receiver_user_id)) || "Unknown receiver";
    const giver =
      (event.giver_user_id ? getProfileDisplayName(profileMap.get(event.giver_user_id)) : "") ||
      event.giver_name ||
      event.giver_email ||
      "Unknown giver";

    return {
      id: event.id,
      recognitionDate: event.created_at,
      receiver,
      giver,
      cardTitle: card?.title ?? "Unknown card",
      category: card ? getCategoryDisplayName(card.category) : "Uncategorized",
      team: team?.name ?? "Unassigned",
      personalNote: event.personal_note ?? ""
    };
  });
}

export function formatReportDate(isoDate: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(isoDate));
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function recognitionRowsToCsv(rows: RecognitionReportRow[]) {
  const header = ["Recognition date", "Receiver", "Giver", "Card title", "Category", "Team", "Personal note"];
  const body = rows.map((row) => [
    formatReportDate(row.recognitionDate),
    row.receiver,
    row.giver,
    row.cardTitle,
    row.category,
    row.team,
    row.personalNote
  ]);

  return [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
}
