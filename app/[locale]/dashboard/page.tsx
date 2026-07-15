import { redirect } from "next/navigation";
import { getRouteForAppRole, normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export default async function DashboardGatewayPage() {
  if (!hasSupabaseServerConfig()) {
    redirect("/login");
  }

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
    .maybeSingle<{ role: AppRole }>();

  if (profileError || !profile) {
    redirect("/auth/repair-profile?next=/dashboard");
  }

  redirect(getRouteForAppRole(normalizeAppRole(profile.role)));
}
