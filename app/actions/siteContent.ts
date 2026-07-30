"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HOME_CONTENT_FIELDS, type SiteContentNamespace } from "@/lib/site-content-fields";

type ActionResult = { ok: true } | { ok: false; error: string };

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

  const rows = HOME_CONTENT_FIELDS.map((field) => {
    const value = String(formData.get(field.key) ?? "").trim();
    return {
      namespace,
      key: field.key,
      locale,
      value,
      updated_by: auth.userId
    };
  });

  const { error } = await auth.supabase.from("site_content").upsert(rows, {
    onConflict: "namespace,key,locale"
  });

  if (error) {
    return { ok: false, error: "Could not save homepage content. Run database migrations if this is a new environment." };
  }

  revalidatePath("/");
  revalidatePath("/nl");
  revalidatePath("/en");
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/admin/site-content`);

  return { ok: true };
}
