"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, supabase, message: "Please log in again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    return { ok: false as const, supabase, message: "You do not have platform admin access." };
  }

  return { ok: true as const, supabase, message: "Authorized." };
}

export async function updateCompanyStatusAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!companyId || !["active", "inactive", "demo"].includes(status)) {
    return;
  }

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return;
  }

  const { error } = await auth.supabase.from("companies").update({ status }).eq("id", companyId);

  if (error) {
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
}

export async function updateCardActiveAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!cardId) {
    return;
  }

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return;
  }

  const { error } = await auth.supabase.from("card_library").update({ active }).eq("id", cardId);

  if (error) {
    return;
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/qr-routes");
  revalidatePath("/cards");
}
