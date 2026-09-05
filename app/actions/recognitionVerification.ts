"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionOutcome } from "@/lib/actions/types";
import { acknowledgeReceivedRecognitionCore, approveRecognitionVerificationCore } from "@/lib/recognition/verify-recognition";

/**
 * The named giver approves a recognition an employee claimed against them
 * (see `claimRecognition`'s `pending_verification` path). Resolving the user from the cookie-based
 * session lives here; the actual business logic — shared with the mobile API — lives in
 * `lib/recognition/verify-recognition.ts`.
 *
 * Role: any authenticated user, but only the row's `giver_user_id` may approve it. Side effects:
 * flips the recognition to `approved`, notifies the receiver, revalidates the employee
 * dashboard/cards/notifications pages, invalidates the receiver's cached growth/AI-signals tag.
 */
export async function approveRecognitionVerification(recognitionId: string): Promise<ActionOutcome> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Please log in before approving this recognition." };
  }

  return approveRecognitionVerificationCore(user, recognitionId);
}

/**
 * The receiver acknowledges a card a colleague gave them digitally
 * (see `giveRecognition`'s `pending_acknowledgement` path). Resolving the user from the
 * cookie-based session lives here; the actual business logic — shared with the mobile API — lives
 * in `lib/recognition/verify-recognition.ts`.
 *
 * Role: any authenticated user, but only the row's `receiver_user_id` may acknowledge it. Side
 * effects: flips the recognition to `approved`, notifies the giver, revalidates the employee
 * dashboard/cards/notifications pages, invalidates the receiver's cached growth/AI-signals tag.
 */
export async function acknowledgeReceivedRecognition(recognitionId: string): Promise<ActionOutcome> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Please log in before acknowledging this recognition." };
  }

  return acknowledgeReceivedRecognitionCore(user, recognitionId);
}
