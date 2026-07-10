import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationInboxRow } from "@/components/NotificationInbox";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardNotificationRole = "manager" | "company_admin" | "platform_admin" | "super_admin";

export type NotificationInboxPageData = {
  user: {
    id: string;
    name: string;
    initials: string;
    team: string;
  };
  notifications: NotificationInboxRow[];
  unreadCount: number;
};

function getInitials(firstName: string | null, lastName: string | null, fallback: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || fallback;
}

function normalizeTeamLabel(role: DashboardNotificationRole, value?: string | null) {
  if (value) return value;
  if (role === "manager") return "Manager";
  if (role === "company_admin") return "Company admin";
  return "Platform";
}

export async function getNotificationInboxPageData({
  allowedRoles,
  redirectTo,
  fallbackInitials
}: {
  allowedRoles: DashboardNotificationRole[];
  redirectTo: string;
  fallbackInitials: string;
}): Promise<NotificationInboxPageData> {
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
    .select("id, first_name, last_name, role, company:companies(company_name), team:teams(name)")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      role: DashboardNotificationRole;
      company: { company_name: string } | Array<{ company_name: string }> | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  if (profileError || !profile) {
    redirect("/auth/repair-profile");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(redirectTo);
  }

  const [{ data: notifications, error: notificationsError }, unreadCount] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, href, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    getUnreadNotificationCount(supabase as SupabaseClient, user.id)
  ]);

  if (notificationsError) {
    throw new Error("Failed to load notifications.");
  }

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  const team = Array.isArray(profile.team) ? profile.team[0] : profile.team;
  const teamLabel = profile.role === "manager" ? team?.name : company?.company_name;

  return {
    user: {
      id: user.id,
      name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH user",
      initials: getInitials(profile.first_name, profile.last_name, fallbackInitials),
      team: normalizeTeamLabel(profile.role, teamLabel)
    },
    notifications: (notifications ?? []) as NotificationInboxRow[],
    unreadCount
  };
}
