"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ALL_HOME_CONTENT_FIELDS, type SiteContentNamespace } from "@/lib/site-content-fields";

type ActionErrorCode = "AUTH_EXPIRED" | "FORBIDDEN" | "INVALID_INPUT" | "NO_FIELDS" | "DATABASE_ERROR";
type ActionResult = { ok: true } | { ok: false; error: string; code: ActionErrorCode };

const ALLOWED_HOME_CONTENT_KEYS = new Set(ALL_HOME_CONTENT_FIELDS.map((field) => field.key));

function normalizeMarqueeFieldValue(key: string, value: string) {
  const trimmed = value.trim();

  if (key === "marqueeBackgroundColor" && trimmed.toLowerCase() === "#fffdf8") {
    return "";
  }

  if (key === "marqueeTextColor" && trimmed.toLowerCase() === "#2a173d") {
    return "";
  }

  return trimmed;
}

function shouldSkipFieldForLocale(locale: string, key: string) {
  return locale === "nl" && key.startsWith("marquee") && key !== "marqueeItems";
}

async function requireGlobalAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (userError) {
      console.error("[site-content] auth.getUser failed", {
        message: userError.message,
        status: userError.status,
        code: userError.code
      });
    }
    return { ok: false as const, code: "AUTH_EXPIRED" as const, error: "Your session expired. Please sign in again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  if (profileError) {
    console.error("[site-content] profile lookup failed", {
      userId: user.id,
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint
    });
    return { ok: false as const, code: "DATABASE_ERROR" as const, error: "Could not verify admin access. Please try again." };
  }

  if (!profile || (profile.role !== "platform_admin" && profile.role !== "super_admin")) {
    return { ok: false as const, code: "FORBIDDEN" as const, error: "Only platform admins can edit site content." };
  }

  return { ok: true as const, supabase, userId: user.id };
}

export async function updateSiteContentAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireGlobalAdmin();
  if (!auth.ok) {
    return { ok: false, code: auth.code, error: auth.error };
  }

  const namespace = String(formData.get("namespace") ?? "home").trim() as SiteContentNamespace;
  const locale = String(formData.get("locale") ?? "en").trim();

  if (locale !== "en" && locale !== "nl") {
    return { ok: false, code: "INVALID_INPUT", error: "Invalid locale." };
  }

  const rows = Array.from(formData.entries())
    .filter(([key]) => key !== "namespace" && key !== "locale")
    .filter(([key]) => ALLOWED_HOME_CONTENT_KEYS.has(key))
    .filter(([key]) => !shouldSkipFieldForLocale(locale, key))
    .map(([key, rawValue]) => {
      const value = String(rawValue ?? "");
      const normalized = key.startsWith("marquee") ? normalizeMarqueeFieldValue(key, value) : value.trim();

      return {
        namespace,
        key,
        locale,
        value: normalized,
        updated_by: auth.userId
      };
    });

  if (!rows.length) {
    return { ok: false, code: "NO_FIELDS", error: "No homepage fields were submitted." };
  }

  const { error } = await auth.supabase.from("site_content").upsert(rows, {
    onConflict: "namespace,key,locale"
  });

  if (error) {
    console.error("[site-content] upsert failed", {
      namespace,
      locale,
      rowCount: rows.length,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return {
      ok: false,
      code: "DATABASE_ERROR",
      error: "Could not save homepage content. Please retry. If this continues, contact support."
    };
  }

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/admin/site-content`);

  return { ok: true };
}
