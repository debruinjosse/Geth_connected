import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationInsert = {
  userId: string;
  companyId?: string | null;
  type: string;
  title: string;
  body: string;
  href?: string | null;
};

export async function createNotification(
  supabase: SupabaseClient,
  notification: NotificationInsert
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: notification.userId,
    company_id: notification.companyId ?? null,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href ?? null
  });

  if (error) {
    console.error("Failed to create notification", error);
  }
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("Failed to count unread notifications", error);
    return 0;
  }

  return count ?? 0;
}
