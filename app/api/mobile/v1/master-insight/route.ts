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
 * GET /api/mobile/v1/master-insight?locale=en|nl
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Backs the Insights hub's hero "GETH AI insight" card (the Generate/Refresh button), which used
 * to silently reuse Growth Timeline's insight type/prompt/endpoint end-to-end. Generated with its
 * own `master_prompt` insight type — its own admin-editable tone guidance and its own 60s cache
 * (see lib/ai/employee-recognition-signals.ts), independent of growth-insights/hidden-patterns.
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
    if (!features.masterInsight) {
      return NextResponse.json({ ok: false, error: "The AI insight is not enabled for your company.", code: "FEATURE_DISABLED" }, { status: 403 });
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
    "master_prompt"
  );

  return NextResponse.json({ ok: true, signals });
}
