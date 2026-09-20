import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanyCardCategories = {
  communication: boolean;
  creativity: boolean;
  competence: boolean;
  collegiality: boolean;
  open: boolean;
};

const DEFAULT_CATEGORIES: CompanyCardCategories = {
  communication: true,
  creativity: true,
  competence: true,
  collegiality: true,
  open: true
};

/**
 * Reads the per-company on/off switches for card categories (see migration 038's
 * `companies.enabled_card_categories`), which the platform admin sets per customer on
 * `admin/companies/[companyId]`. Missing/malformed values default to enabled, so companies
 * created before this column existed behave exactly as they did before.
 */
export async function getCompanyCardCategories(supabase: SupabaseClient, companyId: string): Promise<CompanyCardCategories> {
  const { data, error } = await supabase
    .from("companies")
    .select("enabled_card_categories")
    .eq("id", companyId)
    .maybeSingle<{ enabled_card_categories: Partial<CompanyCardCategories> | null }>();

  if (error || !data?.enabled_card_categories) {
    return DEFAULT_CATEGORIES;
  }

  const flags = data.enabled_card_categories;
  return {
    communication: flags.communication ?? DEFAULT_CATEGORIES.communication,
    creativity: flags.creativity ?? DEFAULT_CATEGORIES.creativity,
    competence: flags.competence ?? DEFAULT_CATEGORIES.competence,
    collegiality: flags.collegiality ?? DEFAULT_CATEGORIES.collegiality,
    open: flags.open ?? DEFAULT_CATEGORIES.open
  };
}
