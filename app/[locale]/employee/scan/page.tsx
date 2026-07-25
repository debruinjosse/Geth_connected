import Link from "next/link";
import { redirect } from "next/navigation";
import { QrScanClient } from "@/components/QrScanClient";
import { DashboardShell } from "@/components/DashboardShell";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GU";
}

type EmployeeScanPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EmployeeScanPage({ params }: EmployeeScanPageProps) {
  const { locale = "en" } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, team_id, profile_image")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null; team_id: string | null; profile_image: string | null }>();

  if (profileError || !profile) redirect("/auth/repair-profile");

  const [{ data: team }, unreadNotifications] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  return (
    <DashboardShell
      role="employee"
      title="Scan a GETH card"
      subtitle="Use your camera to scan a physical recognition card."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH user",
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? "No team assigned",
        imageUrl: profile.profile_image
      }}
      unreadNotifications={unreadNotifications}
    >
      <div className="button-row dashboard-action-row">
        <Link className="btn btn-secondary" href={`/${locale}/cards`}>
          Open card library
        </Link>
      </div>
      <QrScanClient />
    </DashboardShell>
  );
}
