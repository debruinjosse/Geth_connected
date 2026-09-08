"use server";

import { getCardBySlug, resolveCardSlug } from "@/lib/cards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import {
  claimRecognitionCore,
  giveRecognitionCore,
  type ClaimRecognitionInput,
  type ClaimRecognitionSuccess,
  type GiveRecognitionInput,
  type GiveRecognitionSuccess
} from "@/lib/recognition/claim-recognition";

type ClaimRecognitionResult = ActionResult<ClaimRecognitionSuccess | { cardTitle: string; mode: "demo" }>;
type GiveRecognitionResult = ActionResult<GiveRecognitionSuccess | { cardTitle: string; receiverName: string; mode: "demo" }>;

/**
 * Employee self-serve claim of a physical card they received in person. Web-only concerns
 * (demo-mode fallback when Supabase isn't configured, resolving the user from the cookie-based
 * session) live here; the actual business logic — shared with the mobile API — lives in
 * `lib/recognition/claim-recognition.ts`.
 *
 * Role: `employee` only (enforced by `claimRecognitionCore` and by RLS). If `giverUserId` is
 * supplied, the recognition is inserted as `pending_verification` and the named giver is notified
 * to approve it via `approveRecognitionVerification`; otherwise it's inserted as `claimed`
 * immediately. Side effects: inserts into `recognition_events` and `notifications`, invalidates
 * the employee's cached growth/AI-signals tag.
 */
export async function claimRecognition(input: ClaimRecognitionInput): Promise<ClaimRecognitionResult> {
  const resolvedCardSlug = resolveCardSlug(input.cardSlug);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    const card = getCardBySlug(resolvedCardSlug);
    if (!card) {
      return { ok: false, error: "Card not found." };
    }

    return { ok: true, cardTitle: card.title, mode: "demo" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Please log in to claim this recognition.", code: "AUTH_REQUIRED" };
  }

  return claimRecognitionCore(supabase, user, input);
}

/**
 * Employee sends a card digitally to a named colleague in the same company. Web-only concerns
 * live here; the actual business logic — shared with the mobile API — lives in
 * `lib/recognition/claim-recognition.ts`.
 *
 * Role: `employee` only (enforced by `giveRecognitionCore` and by RLS); the receiver must be an
 * active employee in the same company. Inserted as `pending_acknowledgement` until the receiver
 * confirms via `acknowledgeReceivedRecognition`. Side effects: inserts into `recognition_events`
 * and `notifications` (both parties), sends a "recognition received" email if SMTP is configured,
 * invalidates the receiver's cached growth/AI-signals tag.
 */
export async function giveRecognition(input: GiveRecognitionInput): Promise<GiveRecognitionResult> {
  const resolvedCardSlug = resolveCardSlug(input.cardSlug);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    const card = getCardBySlug(resolvedCardSlug);
    if (!card) {
      return { ok: false, error: "Card not found." };
    }

    return { ok: true, cardTitle: card.title, receiverName: "teammate", mode: "demo" };
  }

  // Preserved in this exact order (before the auth check) to match the original behavior.
  if (!input.receiverUserId.trim()) {
    return { ok: false, error: "Choose who should receive this card.", code: "RECEIVER_REQUIRED" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Please log in to give this recognition.", code: "AUTH_REQUIRED" };
  }

  return giveRecognitionCore(supabase, user, input);
}
