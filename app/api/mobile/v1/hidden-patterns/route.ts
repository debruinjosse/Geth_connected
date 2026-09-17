import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { authenticateMobileRequest } from "@/lib/api/authenticate-mobile-request";
import { buildEmployeeSignalsContext } from "@/lib/ai/build-employee-signals-context";
import { fetchEmployeeRecognitionSignals } from "@/app/actions/employeeSignals";
import { getCompanyInsightFeatures } from "@/lib/company-insight-features";
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
 * GET /api/mobile/v1/hidden-patterns?locale=en|nl
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Mobile-only counterpart of `growth-insights/route.ts`, for the Insights hub's "Hidden Patterns"
 * link (`mobile/lib/features/hub/presentation/patterns_screen.dart`). Same `EmployeeSignalsContext`
 * as Growth Timeline, but generated with the `hidden_patterns` insight type — its own prompt/tone
 * (see lib/ai/prompts/employee-insight-prompt.ts, admin-editable in admin/settings) and its own
 * 60s cache, so it no longer just echoes the Growth Timeline output.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const requestedLocale = request.nextUrl.searchParams.get("locale") ?? defaultLocale;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("company_id")
    .eq("id", auth.user.id)
    .maybeSingle<{ company_id: string | null }>();

  if (profile?.company_id) {
    const features = await getCompanyInsightFeatures(auth.supabase, profile.company_id);
    if (!features.hiddenPatterns) {
      return NextResponse.json({ ok: false, error: "Hidden Patterns is not enabled for your company.", code: "FEATURE_DISABLED" }, { status: 403 });
    }
  }

  const [context, t] = await Promise.all([
    buildEmployeeSignalsContext(auth.supabase, auth.user.id, locale),
    getTranslations({ locale, namespace: "employeeDashboard" })
  ]);

  const categoryFallbacks = Object.fromEntries(
    Object.entries(CATEGORY_FALLBACK_KEYS).map(([category, key]) => [category, t(key)])
  );

  const signals = await fetchEmployeeRecognitionSignals(
    context,
    {
      emptyTitle: t("emptySignalTitle"),
      emptyDetail: t("emptySignalDetail"),
      insightTitle: t("coachingInsightTitle"),
      fallbackInsight: t("coachingFallbackDefault"),
      categoryFallbacks
    },
    "hidden_patterns"
  );

  return NextResponse.json({ ok: true, signals });
}
