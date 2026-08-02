"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ALL_HOME_CONTENT_FIELDS, type SiteContentNamespace } from "@/lib/site-content-fields";

type ActionResult = { ok: true } | { ok: false; error: string };

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
    return { ok: false as const, error: "You must be signed in as a platform admin." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  if (!profile || (profile.role !== "platform_admin" && profile.role !== "super_admin")) {
    return { ok: false as const, error: "Only platform admins can edit site content." };
  }

  return { ok: true as const, supabase, userId: user.id };
}

export async function updateSiteContentAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireGlobalAdmin();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const namespace = String(formData.get("namespace") ?? "home").trim() as SiteContentNamespace;
  const locale = String(formData.get("locale") ?? "en").trim();

  if (locale !== "en" && locale !== "nl") {
    return { ok: false, error: "Invalid locale." };
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
    return { ok: false, error: "No homepage fields were submitted." };
  }

  const { error } = await auth.supabase.from("site_content").upsert(rows, {
    onConflict: "namespace,key,locale"
  });

  if (error) {
    return { ok: false, error: "Could not save homepage content. Run database migrations if this is a new environment." };
  }

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/admin/site-content`);

  return { ok: true };
}
