"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_TONE_GUIDANCE_LENGTH = 4000;

async function requireGlobalAdminForAiSettings() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  return { user };
}

async function upsertToneGuidance(toneGuidance: string, userId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const payload = { tone_guidance: toneGuidance, updated_by: userId };

  const { data: existing } = await adminSupabase
    .from("ai_master_prompt_settings")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existing?.id) {
    const { error } = await adminSupabase.from("ai_master_prompt_settings").update(payload).eq("id", existing.id);
    return error;
  }

  const { error } = await adminSupabase.from("ai_master_prompt_settings").insert(payload);
  return error;
}

/**
 * Role: `platform_admin`/`super_admin` only. Updates the global tone-guidance block appended to
 * the AI insight system prompt (see lib/ai/prompts/employee-insight-prompt.ts). Never touches the
 * hardcoded JSON output contract or safety rules — this is additive, tone-only text.
 */
export async function updateAiMasterPromptSettingsAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const returnTo = `/${locale}/admin/settings`;
  const { user } = await requireGlobalAdminForAiSettings();

  const toneGuidance = String(formData.get("toneGuidance") ?? "").trim();

  if (toneGuidance.length > MAX_TONE_GUIDANCE_LENGTH) {
    redirect(`${returnTo}?settings=ai-prompt-too-long`);
  }

  const error = await upsertToneGuidance(toneGuidance, user.id);
  if (error) {
    redirect(`${returnTo}?settings=ai-prompt-save-failed`);
  }

  redirect(`${returnTo}?settings=ai-prompt-saved`);
}

/**
 * Role: `platform_admin`/`super_admin` only. Resets the tone-guidance block back to the hardcoded
 * default by writing an empty string (the sentinel getMasterToneGuidance() falls back on).
 */
export async function resetAiMasterPromptSettingsAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const returnTo = `/${locale}/admin/settings`;
  const { user } = await requireGlobalAdminForAiSettings();

  const error = await upsertToneGuidance("", user.id);
  if (error) {
    redirect(`${returnTo}?settings=ai-prompt-save-failed`);
  }

  redirect(`${returnTo}?settings=ai-prompt-reset`);
}
