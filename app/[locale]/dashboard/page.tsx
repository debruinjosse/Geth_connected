import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getRouteForAppRole, normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { localizePublicHref } from "@/lib/navigation/public-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

type DashboardGatewayPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardGatewayPage({ params }: DashboardGatewayPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!hasSupabaseServerConfig()) {
    redirect(localizePublicHref("/login", locale));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(localizePublicHref("/login", locale));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: AppRole }>();

  if (profileError || !profile) {
    redirect(`/auth/repair-profile?next=${encodeURIComponent(localizePublicHref("/dashboard", locale))}`);
  }

  redirect(localizePublicHref(getRouteForAppRole(normalizeAppRole(profile.role)), locale));
}
