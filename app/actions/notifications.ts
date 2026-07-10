"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationMutationResult = {
  ok: boolean;
  message: string;
};

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = String(formData.get("notification_id") || "").trim();

  if (!notificationId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return;
  }

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

export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return;
  }

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
