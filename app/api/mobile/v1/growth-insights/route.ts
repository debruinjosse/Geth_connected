import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { authenticateMobileRequest } from "@/lib/api/authenticate-mobile-request";
import { buildEmployeeSignalsContext } from "@/lib/ai/build-employee-signals-context";
import { fetchEmployeeRecognitionSignals } from "@/app/actions/employeeSignals";
import { defaultLocale, isAppLocale } from "@/i18n/routing";

const CATEGORY_FALLBACK_KEYS: Record<string, string> = {
  Communication: "coachingFallbackCommunication",
  Communicatie: "coachingFallbackCommunication",
  Creativity: "coachingFallbackCreativity",
  Creativiteit: "coachingFallbackCreativity",
  Competence: "coachingFallbackCompetence",
  Competentie: "coachingFallbackCompetence",
  Collegiality: "coachingFallbackCollegiality",
  Collegialiteit: "coachingFallbackCollegiality",
  default: "coachingFallbackDefault"
};

/**
 * GET /api/mobile/v1/growth-insights?locale=en|nl
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Mobile counterpart of the "growth" AI-coaching panel on the web employee dashboard
 * (`components/EmployeeAiSignalsPanel.tsx`) — builds the same `EmployeeSignalsContext` (via
 * `buildEmployeeSignalsContext`, shared with the web dashboard page) and the same locale-specific
 * fallback labels, then calls the existing `fetchEmployeeRecognitionSignals` Server Action
 * directly (safe to import and call from a Route Handler — it's just an async function on the
 * server side; the special Server Action wiring only matters when it's called from a *client*
 * component). Does not include growth-chart data (monthly trend, quality-mix percentages) — by
 * design, Flutter computes that itself from raw `recognition_events` rows read directly via
 * Supabase.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const requestedLocale = request.nextUrl.searchParams.get("locale") ?? defaultLocale;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;

  const [context, t] = await Promise.all([
    buildEmployeeSignalsContext(auth.supabase, auth.user.id, locale),
    getTranslations({ locale, namespace: "employeeDashboard" })
  ]);

  const categoryFallbacks = Object.fromEntries(
    Object.entries(CATEGORY_FALLBACK_KEYS).map(([category, key]) => [category, t(key)])
  );

  const signals = await fetchEmployeeRecognitionSignals(context, {
    emptyTitle: t("emptySignalTitle"),
    emptyDetail: t("emptySignalDetail"),
    insightTitle: t("coachingInsightTitle"),
    fallbackInsight: t("coachingFallbackDefault"),
    categoryFallbacks
  });

  return NextResponse.json({ ok: true, signals });
}
