"use server";

import { getCardBySlug, resolveCardSlug } from "@/lib/cards";
import { createNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function claimRecognition(input: {
  cardSlug: string;
  giverUserId?: string;
  giverName?: string;
  giverEmail?: string;
  personalNote?: string;
  claimOrigin?: "qr_scan" | "direct_link" | "card_library" | "manual_entry";
}) {
  const resolvedCardSlug = resolveCardSlug(input.cardSlug);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    const card = getCardBySlug(resolvedCardSlug);
    if (!card) {
      return { ok: false as const, error: "Card not found." };
    }

    return { ok: true as const, cardTitle: card.title, mode: "demo" as const };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false as const, error: "Please log in to claim this recognition.", code: "AUTH_REQUIRED" as const };
    }

    const { data: receiverProfile, error: receiverProfileError } = await supabase
      .from("profiles")
      .select("id, company_id, team_id")
      .eq("id", user.id)
      .maybeSingle<{ id: string; company_id: string | null; team_id: string | null }>();

    if (receiverProfileError || !receiverProfile?.company_id) {
      return { ok: false as const, error: "Your profile is missing company information.", code: "PROFILE_MISSING" as const };
    }

    const { data: cardRecord, error: cardError } = await supabase
      .from("card_library")
      .select("id, title")
      .eq("qr_slug", resolvedCardSlug)
      .eq("active", true)
      .maybeSingle<{ id: string; title: string }>();

    if (cardError || !cardRecord) {
      return { ok: false as const, error: "Card not found.", code: "CARD_NOT_FOUND" as const };
    }

    const claimOrigin = input.claimOrigin ?? "direct_link";
    const needsGiverVerification = Boolean(input.giverUserId);
    const recognitionPayload = {
      company_id: receiverProfile.company_id,
      team_id: receiverProfile.team_id,
      card_id: cardRecord.id,
      receiver_user_id: user.id,
      giver_user_id: input.giverUserId ?? null,
      giver_name: input.giverName?.trim() || null,
      giver_email: input.giverEmail?.trim() || null,
      personal_note: input.personalNote?.trim() || null,
      claim_origin: claimOrigin,
      originated_digitally: ["qr_scan", "direct_link", "card_library", "manual_entry"].includes(claimOrigin),
      claimed_at: new Date().toISOString()
    };

    let verificationPending = needsGiverVerification;
    let { data: insertedRecognition, error: insertError } = await supabase
      .from("recognition_events")
      .insert({
        ...recognitionPayload,
        status: needsGiverVerification ? "pending_verification" : "claimed"
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError && needsGiverVerification && /pending_verification|recognition_status|invalid input value/i.test(insertError.message)) {
      verificationPending = false;
      const retry = await supabase
        .from("recognition_events")
        .insert({
          ...recognitionPayload,
          status: "claimed"
        })
        .select("id")
        .single<{ id: string }>();
      insertedRecognition = retry.data;
      insertError = retry.error;
    }

    if (insertError) {
      return { ok: false as const, error: "We couldn't save this recognition yet. Please try again.", code: "INSERT_FAILED" as const };
    }

    if (insertedRecognition) {
      const admin = createSupabaseAdminClient();
      await createNotification(admin, {
        userId: user.id,
        companyId: receiverProfile.company_id,
        type: "recognition_received",
        title: "Recognition claimed",
        body: verificationPending
          ? `Your ${cardRecord.title} recognition was sent to ${input.giverName?.trim() || "the giver"} for verification.`
          : `Your ${cardRecord.title} recognition was added to your dashboard.`,
        href: "/employee"
      });

      if (verificationPending && input.giverUserId) {
        await createNotification(admin, {
          userId: input.giverUserId,
          companyId: receiverProfile.company_id,
          type: "recognition_verification_requested",
          title: "Approve a recognition",
          body: `${input.giverName?.trim() ? "You were selected as the giver" : "A teammate selected you as the giver"} for a ${cardRecord.title} card. Please approve it to verify the recognition.`,
          href: "/employee"
        });
      }
    }

    return { ok: true as const, cardTitle: cardRecord.title, mode: "supabase" as const };
  } catch {
    return { ok: false as const, error: "Something went wrong while claiming this recognition.", code: "UNKNOWN" as const };
  }
}
