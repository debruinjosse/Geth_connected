import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TONE_GUIDANCE =
  "Be warm, specific, and encouraging. Sound like a supportive coach, not a corporate evaluator.";

export type AiMasterPromptSettingsRow = {
  tone_guidance: string;
  updated_at: string | null;
  updated_by: string | null;
};

/**
 * RLS-scoped read for the admin settings page (super_admin/platform_admin session), distinct from
 * getMasterToneGuidance() below which uses the admin client for insight-generation-time reads.
 */
export async function loadAiMasterPromptSettings(supabase: SupabaseClient): Promise<AiMasterPromptSettingsRow | null> {
  const { data, error } = await supabase
    .from("ai_master_prompt_settings")
    .select("tone_guidance, updated_at, updated_by")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<AiMasterPromptSettingsRow>();

  if (error) {
    console.warn("loadAiMasterPromptSettings failed:", error.message);
    return null;
  }

  return data;
}

/**
 * Reads the super-admin-editable "tone guidance" block appended to the AI insight system prompt
 * (see lib/ai/prompts/employee-insight-prompt.ts). An empty/missing value falls back to the
 * hardcoded default so "reset to default" and "never configured yet" behave identically.
 */
export async function getMasterToneGuidance(): Promise<string> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("ai_master_prompt_settings")
      .select("tone_guidance")
      .limit(1)
      .maybeSingle<{ tone_guidance: string }>();

    return data?.tone_guidance?.trim() || DEFAULT_TONE_GUIDANCE;
  } catch {
    return DEFAULT_TONE_GUIDANCE;
  }
}
