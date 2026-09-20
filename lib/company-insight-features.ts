import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanyInsightFeatures = {
  growthTimeline: boolean;
  hiddenPatterns: boolean;
  milestones: boolean;
  masterInsight: boolean;
};

const DEFAULT_FEATURES: CompanyInsightFeatures = {
  growthTimeline: true,
  hiddenPatterns: true,
  milestones: true,
  masterInsight: true
};

/**
 * Reads the per-company on/off switches for the Insights hub's premium sections (see migration
 * 037's `companies.enabled_insight_features`), which the super admin sets per customer on
 * `admin/companies/[companyId]`. Missing/malformed values default to enabled, so companies created
 * before this column existed behave exactly as they did before.
 */
export async function getCompanyInsightFeatures(supabase: SupabaseClient, companyId: string): Promise<CompanyInsightFeatures> {
  const { data, error } = await supabase
    .from("companies")
    .select("enabled_insight_features")
    .eq("id", companyId)
    .maybeSingle<{ enabled_insight_features: Partial<CompanyInsightFeatures> | null }>();

  if (error || !data?.enabled_insight_features) {
    return DEFAULT_FEATURES;
  }

  const flags = data.enabled_insight_features;
  return {
    growthTimeline: flags.growthTimeline ?? DEFAULT_FEATURES.growthTimeline,
    hiddenPatterns: flags.hiddenPatterns ?? DEFAULT_FEATURES.hiddenPatterns,
    milestones: flags.milestones ?? DEFAULT_FEATURES.milestones,
    masterInsight: flags.masterInsight ?? DEFAULT_FEATURES.masterInsight
  };
}
