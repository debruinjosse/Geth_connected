import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type InsightType = "growth_timeline" | "hidden_patterns";

const DEFAULT_TONE_GUIDANCE =
  "Be warm, specific, and encouraging. Sound like a supportive coach, not a corporate evaluator.";

export type AiMasterPromptSettingsRow = {
  insight_type: InsightType;
  tone_guidance: string;
  updated_at: string | null;
  updated_by: string | null;
};

/**
 * RLS-scoped read for the admin settings page (super_admin/platform_admin session), distinct from
 * getMasterToneGuidance() below which uses the admin client for insight-generation-time reads.
 * Growth Timeline and Hidden Patterns each have their own row (see migration 037), so this always
 * scopes to one `insightType`.
 */
export async function loadAiMasterPromptSettings(
  supabase: SupabaseClient,
  insightType: InsightType = "growth_timeline"
): Promise<AiMasterPromptSettingsRow | null> {
  const { data, error } = await supabase
    .from("ai_master_prompt_settings")
    .select("insight_type, tone_guidance, updated_at, updated_by")
    .eq("insight_type", insightType)
    .maybeSingle<AiMasterPromptSettingsRow>();

  if (error) {
    console.warn("loadAiMasterPromptSettings failed:", error.message);
    return null;
  }

  return data;
}

/**
 * Reads the super-admin-editable "tone guidance" block appended to the AI insight system prompt
 * for one insight type (see lib/ai/prompts/employee-insight-prompt.ts). An empty/missing value
 * falls back to the hardcoded default so "reset to default" and "never configured yet" behave
 * identically.
 */
export async function getMasterToneGuidance(insightType: InsightType = "growth_timeline"): Promise<string> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("ai_master_prompt_settings")
      .select("tone_guidance")
      .eq("insight_type", insightType)
      .maybeSingle<{ tone_guidance: string }>();

    return data?.tone_guidance?.trim() || DEFAULT_TONE_GUIDANCE;
  } catch {
    return DEFAULT_TONE_GUIDANCE;
  }
}
