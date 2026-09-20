import { NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/authenticate-mobile-request";
import { getCompanyCardCategories } from "@/lib/company-card-categories";

/**
 * GET /api/mobile/v1/company-card-categories
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Tells the "give a card" flow (`mobile/lib/features/recognition/presentation/give_card_screen.dart`)
 * which of the 5 card categories (Communication/Creativity/Competence/Collegiality/Open) the
 * caller's company has enabled, so cards from a disabled category never appear in the list.
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

  const categories = await getCompanyCardCategories(auth.supabase, profile.company_id);
  return NextResponse.json({ ok: true, categories });
}
