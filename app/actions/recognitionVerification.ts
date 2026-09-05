"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getEmployeeAiSignalsCacheTag } from "@/lib/ai/employee-recognition-signals";
import { createNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionOutcome } from "@/lib/actions/types";

/**
 * The named giver approves a recognition an employee claimed against them
 * (see `claimRecognition`'s `pending_verification` path).
 *
 * Role: any authenticated user, but only the row's `giver_user_id` may approve it (checked here,
 * not just by RLS, since the update runs through the admin client). Side effects: flips the
 * recognition to `approved`, notifies the receiver, revalidates the employee dashboard/cards/
 * notifications pages, invalidates the receiver's cached growth/AI-signals tag.
 */
export async function approveRecognitionVerification(recognitionId: string): Promise<ActionOutcome> {
  const cleanRecognitionId = recognitionId.trim();

  if (!cleanRecognitionId) {
    return { ok: false, message: "Missing recognition to approve." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Please log in before approving this recognition." };
  }

  const admin = createSupabaseAdminClient();
  const { data: recognition, error: recognitionError } = await admin
    .from("recognition_events")
    .select("id, company_id, receiver_user_id, giver_user_id, status, card:card_library(title)")
    .eq("id", cleanRecognitionId)
    .maybeSingle<{
      id: string;
      company_id: string | null;
      receiver_user_id: string;
      giver_user_id: string | null;
      status: string;
      card: { title: string } | Array<{ title: string }> | null;
    }>();

  if (recognitionError || !recognition) {
    return { ok: false, message: "Recognition not found." };
  }

  if (recognition.giver_user_id !== user.id) {
    return { ok: false, message: "Only the selected giver can approve this recognition." };
  }

  if (recognition.status === "approved") {
    return { ok: true, message: "This recognition is already approved." };
  }

  const { error: updateError } = await admin
    .from("recognition_events")
    .update({ status: "approved" })
    .eq("id", cleanRecognitionId)
    .eq("giver_user_id", user.id);

  if (updateError) {
    return { ok: false, message: "Could not approve this recognition yet. Please try again." };
  }

  const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
  await createNotification(admin, {
    userId: recognition.receiver_user_id,
    companyId: recognition.company_id,
    type: "recognition_verified",
    title: "Recognition verified",
    body: `Your ${card?.title ?? "GETH"} recognition was approved by the giver.`,
    href: "/employee/notifications"
  });

  revalidatePath("/employee");
  revalidatePath("/employee/cards");
  revalidatePath("/employee/notifications");
  revalidateTag(getEmployeeAiSignalsCacheTag(recognition.receiver_user_id), "max");

  return { ok: true, message: "Recognition approved. Thank you for verifying it." };
}

/**
 * The receiver acknowledges a card a colleague gave them digitally
 * (see `giveRecognition`'s `pending_acknowledgement` path).
 *
 * Role: any authenticated user, but only the row's `receiver_user_id` may acknowledge it (checked
 * here, not just by RLS, since the update runs through the admin client). Side effects: flips the
 * recognition to `approved`, notifies the giver, revalidates the employee dashboard/cards/
 * notifications pages, invalidates the receiver's cached growth/AI-signals tag.
 */
export async function acknowledgeReceivedRecognition(recognitionId: string): Promise<ActionOutcome> {
  const cleanRecognitionId = recognitionId.trim();

  if (!cleanRecognitionId) {
    return { ok: false, message: "Missing recognition to acknowledge." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Please log in before acknowledging this recognition." };
  }

  const admin = createSupabaseAdminClient();
  const { data: recognition, error: recognitionError } = await admin
    .from("recognition_events")
    .select("id, company_id, receiver_user_id, giver_user_id, status, card:card_library(title)")
    .eq("id", cleanRecognitionId)
    .maybeSingle<{
      id: string;
      company_id: string | null;
      receiver_user_id: string;
      giver_user_id: string | null;
      status: string;
      card: { title: string } | Array<{ title: string }> | null;
    }>();

  if (recognitionError || !recognition) {
    return { ok: false, message: "Recognition not found." };
  }

  if (recognition.receiver_user_id !== user.id) {
    return { ok: false, message: "Only the receiver can acknowledge this recognition." };
  }

  if (recognition.status === "approved") {
    return { ok: true, message: "This recognition is already acknowledged." };
  }

  const { error: updateError } = await admin
    .from("recognition_events")
    .update({ status: "approved" })
    .eq("id", cleanRecognitionId)
    .eq("receiver_user_id", user.id);

  if (updateError) {
    return { ok: false, message: "Could not acknowledge this recognition yet. Please try again." };
  }

  const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;

  if (recognition.giver_user_id) {
    await createNotification(admin, {
      userId: recognition.giver_user_id,
      companyId: recognition.company_id,
      type: "recognition_acknowledged",
      title: "Recognition acknowledged",
      body: `Your ${card?.title ?? "GETH"} card was acknowledged by the receiver.`,
      href: "/employee/cards"
    });
  }

  revalidatePath("/employee");
  revalidatePath("/employee/cards");
  revalidatePath("/employee/notifications");
  revalidateTag(getEmployeeAiSignalsCacheTag(user.id), "max");

  return { ok: true, message: "Recognition acknowledged. It is now verified on both dashboards." };
}
