import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SiteContentNamespace } from "@/lib/site-content-fields";

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getSiteContentOverrides(namespace: SiteContentNamespace, locale: string): Promise<Record<string, string>> {
  if (!hasSupabaseConfig()) {
    return {};
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("key, value")
      .eq("namespace", namespace)
      .eq("locale", locale);

    if (error || !data?.length) {
      return {};
    }

    return Object.fromEntries(data.map((row) => [row.key, row.value]));
  } catch {
    return {};
  }
}

export async function getAllSiteContentForNamespace(namespace: SiteContentNamespace) {
  if (!hasSupabaseConfig()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("key, locale, value, updated_at")
      .eq("namespace", namespace)
      .order("key");

    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export function pickSiteContentText(overrides: Record<string, string>, fallback: string, key: string) {
  const custom = overrides[key]?.trim();
  return custom || fallback;
}

export function pickOptionalSiteContentText(overrides: Record<string, string>, fallback: string, key: string) {
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key].trim();
  }

  return fallback.trim();
}
