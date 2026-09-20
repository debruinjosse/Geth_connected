"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsightType } from "@/lib/ai/master-prompt-settings";

const MAX_TONE_GUIDANCE_LENGTH = 4000;

function resolveInsightType(value: FormDataEntryValue | null): InsightType {
  if (value === "hidden_patterns") return "hidden_patterns";
  if (value === "master_prompt") return "master_prompt";
  return "growth_timeline";
}

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

async function upsertToneGuidance(insightType: InsightType, toneGuidance: string, userId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const payload = { insight_type: insightType, tone_guidance: toneGuidance, updated_by: userId };

  const { data: existing } = await adminSupabase
    .from("ai_master_prompt_settings")
    .select("id")
    .eq("insight_type", insightType)
    .maybeSingle<{ id: string }>();

  if (existing?.id) {
    const { error } = await adminSupabase.from("ai_master_prompt_settings").update(payload).eq("id", existing.id);
    return error;
  }

  const { error } = await adminSupabase.from("ai_master_prompt_settings").insert(payload);
  return error;
}

/**
 * Role: `platform_admin`/`super_admin` only. Updates the tone-guidance block appended to the AI
 * insight system prompt for one insight type — Growth Timeline and Hidden Patterns each have their
 * own row (see migration 037) — never touching the hardcoded JSON output contract or safety rules.
 */
export async function updateAiMasterPromptSettingsAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const insightType = resolveInsightType(formData.get("insightType"));
  const returnTo = `/${locale}/admin/settings`;
  const { user } = await requireGlobalAdminForAiSettings();

  const toneGuidance = String(formData.get("toneGuidance") ?? "").trim();

  if (toneGuidance.length > MAX_TONE_GUIDANCE_LENGTH) {
    redirect(`${returnTo}?settings=ai-prompt-too-long`);
  }

  const error = await upsertToneGuidance(insightType, toneGuidance, user.id);
  if (error) {
    redirect(`${returnTo}?settings=ai-prompt-save-failed`);
  }

  // Every generated insight is cached for 60s (lib/ai/employee-recognition-signals.ts) under this
  // shared tag, regardless of employee or insight type — without this, a saved prompt change would
  // silently keep serving old output to anyone whose cache hadn't expired yet.
  revalidateTag("employee-ai-signals", "max");

  redirect(`${returnTo}?settings=ai-prompt-saved`);
}

/**
 * Role: `platform_admin`/`super_admin` only. Resets one insight type's tone-guidance block back to
 * the hardcoded default by writing an empty string (the sentinel getMasterToneGuidance() falls
 * back on).
 */
export async function resetAiMasterPromptSettingsAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const insightType = resolveInsightType(formData.get("insightType"));
  const returnTo = `/${locale}/admin/settings`;
  const { user } = await requireGlobalAdminForAiSettings();

  const error = await upsertToneGuidance(insightType, "", user.id);
  if (error) {
    redirect(`${returnTo}?settings=ai-prompt-save-failed`);
  }

  revalidateTag("employee-ai-signals", "max");

  redirect(`${returnTo}?settings=ai-prompt-reset`);
}
