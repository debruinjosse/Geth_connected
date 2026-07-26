import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const validEvents = new Set(["page_view", "time_spent"]);
const validLocales = new Set(["nl", "en"]);
let hasLoggedAnalyticsWarning = false;

function warnAnalyticsOnce(message: string, error: unknown) {
  if (hasLoggedAnalyticsWarning) return;
  hasLoggedAnalyticsWarning = true;

  const detail =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);

  console.warn(`${message} ${detail}`);
}

function noContent() {
  return new Response(null, { status: 204 });
}

function sanitizePath(value: unknown) {
  const path = String(value ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("/api/analytics")) return "/";
  return path.slice(0, 500);
}

function sanitizeLocale(value: unknown) {
  const locale = String(value ?? "nl").trim();
  return validLocales.has(locale) ? locale : "nl";
}

export async function POST(request: NextRequest) {
  let payload: {
    eventType?: string;
    path?: string;
    locale?: string;
    durationSeconds?: number;
  };

  try {
    payload = await request.json();
  } catch {
    return noContent();
  }

  const eventType = String(payload.eventType);

  if (!validEvents.has(eventType)) {
    return noContent();
  }

  const durationSeconds =
    eventType === "time_spent"
      ? Math.min(60 * 60 * 4, Math.max(1, Math.round(Number(payload.durationSeconds ?? 1))))
      : null;

  let userId: string | null = null;
  let companyId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle<{ company_id: string | null }>();
      companyId = profile?.company_id ?? null;
    }
  } catch {
    userId = null;
    companyId = null;
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { error } = await adminSupabase.from("platform_analytics_events").insert({
      user_id: userId,
      company_id: companyId,
      locale: sanitizeLocale(payload.locale),
      path: sanitizePath(payload.path),
      event_type: eventType,
      duration_seconds: durationSeconds,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null
    });

    if (error) {
      warnAnalyticsOnce("Analytics tracking skipped.", error);
    }
  } catch (error) {
    warnAnalyticsOnce("Analytics tracking disabled.", error);
  }

  return noContent();
}
