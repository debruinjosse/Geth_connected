import { NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/authenticate-mobile-request";
import { getCompanyInsightFeatures } from "@/lib/company-insight-features";

/**
 * GET /api/mobile/v1/company-insight-features
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Tells the Insights hub (`mobile/lib/features/insights/presentation/insights_screen.dart`) which
 * of the "Premium inzichten" links (Growth Timeline, Hidden Patterns, Milestones) the caller's
 * company has enabled, so a company that's had one turned off never even sees the link — not just
 * blocked from opening it.
 */
export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("company_id")
    .eq("id", auth.user.id)
    .maybeSingle<{ company_id: string | null }>();

  if (profileError || !profile?.company_id) {
    return NextResponse.json({ ok: false, error: "Your profile is missing company information." }, { status: 400 });
  }

  const features = await getCompanyInsightFeatures(auth.supabase, profile.company_id);
  return NextResponse.json({ ok: true, features });
}
