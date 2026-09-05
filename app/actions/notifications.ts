"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationMutationResult = {
  ok: boolean;
  message: string;
};

async function getNotificationSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      if (error) {
        console.warn("Skipping notification mutation because the auth session could not be read", error.message);
      }

      return null;
    }

    return { supabase, user };
  } catch (error) {
    console.warn("Skipping notification mutation because Supabase auth threw", error);
    return null;
  }
}

/** Any authenticated user marks one of their own notifications as read. */
export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = String(formData.get("notification_id") || "").trim();

  if (!notificationId) {
    return;
  }

  const session = await getNotificationSession();
  if (!session) {
    return;
  }

  const { supabase, user } = session;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to mark notification read", error);
    return;
  }

  revalidatePath("/employee/notifications");
  revalidatePath("/manager/notifications");
  revalidatePath("/company/notifications");
  revalidatePath("/admin/notifications");
  revalidatePath("/employee");
  revalidatePath("/manager");
  revalidatePath("/company");
  revalidatePath("/admin");
}

/** Any authenticated user marks all of their own unread notifications as read. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await getNotificationSession();
  if (!session) {
    return;
  }

  const { supabase, user } = session;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Failed to mark all notifications read", error);
    return;
  }

  revalidatePath("/employee/notifications");
  revalidatePath("/manager/notifications");
  revalidatePath("/company/notifications");
  revalidatePath("/admin/notifications");
  revalidatePath("/employee");
  revalidatePath("/manager");
  revalidatePath("/company");
  revalidatePath("/admin");
}
