import { NextRequest } from "next/server";
import { getRecognitionReportRange } from "@/lib/reports/recognition-report";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RecognitionExportRow = {
  id: string;
  company_id: string;
  giver_user_id: string | null;
  receiver_user_id: string;
  card_id: string | number;
  created_at: string;
  card: { title: string; category: string } | Array<{ title: string; category: string }> | null;
};

type ExportGroup = {
  companyId: string;
  companyName: string;
  giverUserId: string;
  receiverUserId: string;
  cardId: string | number;
  cardTitle: string;
  category: string;
  count: number;
  firstRecognitionAt: string;
  lastRecognitionAt: string;
};

function getSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: ExportGroup[]) {
  const header = [
    "company_id",
    "company_name",
    "giver_user_id",
    "receiver_user_id",
    "card_id",
    "card_title",
    "category",
    "recognition_count",
    "first_recognition_at",
    "last_recognition_at",
    "privacy_note"
  ];

  const body = rows.map((row) => [
    row.companyId,
    row.companyName,
    row.giverUserId,
    row.receiverUserId,
    row.cardId,
    row.cardTitle,
    row.category,
    row.count,
    row.firstRecognitionAt,
    row.lastRecognitionAt,
    "GDPR-safe export: no names, emails, or personal notes included"
  ]);

  return [header, ...body].map((line) => line.map(escapeCsv).join(",")).join("\n");
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const range = getRecognitionReportRange({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined
  });

  const { data: recognitionRows, error: recognitionError } = await supabase
    .from("recognition_events")
    .select("id, company_id, giver_user_id, receiver_user_id, card_id, created_at, card:card_library(title, category)")
    .gte("created_at", range.fromIso)
    .lte("created_at", range.toIso)
    .order("created_at", { ascending: true });

  if (recognitionError) {
    return new Response("Unable to load recognition export data", { status: 500 });
  }

  const events = (recognitionRows ?? []) as RecognitionExportRow[];
  const companyIds = Array.from(new Set(events.map((event) => event.company_id).filter(Boolean)));
  const { data: companies, error: companiesError } = companyIds.length
    ? await supabase.from("companies").select("id, company_name").in("id", companyIds)
    : { data: [] as Array<{ id: string; company_name: string }>, error: null };

  if (companiesError) {
    return new Response("Unable to load company export data", { status: 500 });
  }

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company.company_name]));
  const grouped = new Map<string, ExportGroup>();

  for (const event of events) {
    const card = getSingle(event.card);
    const giverUserId = event.giver_user_id ?? "external_or_manual_giver";
    const key = [event.company_id, giverUserId, event.receiver_user_id, event.card_id].join("|");
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
      existing.firstRecognitionAt = event.created_at < existing.firstRecognitionAt ? event.created_at : existing.firstRecognitionAt;
      existing.lastRecognitionAt = event.created_at > existing.lastRecognitionAt ? event.created_at : existing.lastRecognitionAt;
      continue;
    }

    grouped.set(key, {
      companyId: event.company_id,
      companyName: companyMap.get(event.company_id) ?? "Unknown company",
      giverUserId,
      receiverUserId: event.receiver_user_id,
      cardId: event.card_id,
      cardTitle: card?.title ?? "Unknown card",
      category: card?.category ?? "Uncategorized",
      count: 1,
      firstRecognitionAt: event.created_at,
      lastRecognitionAt: event.created_at
    });
  }

  const rows = Array.from(grouped.values()).sort((a, b) =>
    a.companyName.localeCompare(b.companyName) ||
    a.receiverUserId.localeCompare(b.receiverUserId) ||
    a.cardTitle.localeCompare(b.cardTitle)
  );
  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="geth-platform-privacy-safe-recognition-export-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
