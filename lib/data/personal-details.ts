import type { SupabaseClient } from "@supabase/supabase-js";
import type { PersonalDetails } from "@/components/AccountSettingsPanel";

/** The signed-in user's optional personal details; empty values if none saved yet (or the table is unavailable). */
export async function loadOwnPersonalDetails(supabase: SupabaseClient, userId: string): Promise<PersonalDetails> {
  const { data, error } = await supabase
    .from("profile_personal_details")
    .select("gender, birthdate, mobile_number, city")
    .eq("user_id", userId)
    .maybeSingle<{ gender: string | null; birthdate: string | null; mobile_number: string | null; city: string | null }>();

  if (error) {
    console.warn("loadOwnPersonalDetails failed:", error.message);
  }

  return {
    gender: data?.gender ?? null,
    birthdate: data?.birthdate ?? null,
    mobileNumber: data?.mobile_number ?? null,
    city: data?.city ?? null
  };
}
