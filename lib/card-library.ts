import { createClient } from "@supabase/supabase-js";
import { getCardBySlug, gethCards, mapCardLibraryRowToCard, resolveCardSlug, type CardLibraryRow, type GethCard } from "@/lib/cards";

function hasSupabaseCardLibraryConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function createSupabaseCardLibraryClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function getPublicCardLibrary(): Promise<GethCard[]> {
  if (!hasSupabaseCardLibraryConfig()) {
    return gethCards;
  }

  const supabase = createSupabaseCardLibraryClient();
  const { data, error } = await supabase
    .from("card_library")
    .select("card_number, title, category, description, recognition_sentence, qr_slug, active")
    .eq("active", true)
    .order("card_number", { ascending: true });

  if (error || !data) {
    return gethCards;
  }

  return (data as CardLibraryRow[]).map(mapCardLibraryRowToCard);
}

export async function getPublicCardBySlug(slug: string): Promise<GethCard | null> {
  const resolvedSlug = resolveCardSlug(slug);

  if (!hasSupabaseCardLibraryConfig()) {
    return getCardBySlug(resolvedSlug) ?? null;
  }

  const supabase = createSupabaseCardLibraryClient();
  const { data, error } = await supabase
    .from("card_library")
    .select("card_number, title, category, description, recognition_sentence, qr_slug, active")
    .eq("qr_slug", resolvedSlug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return getCardBySlug(resolvedSlug) ?? null;
  }

  return data ? mapCardLibraryRowToCard(data as CardLibraryRow) : null;
}
