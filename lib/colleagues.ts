import type { SupabaseClient } from "@supabase/supabase-js";

export type ColleagueOption = {
  id: string;
  name: string;
  initials: string;
  team: string;
  email?: string;
  imageUrl?: string | null;
};

const COLLEAGUE_ROLES = ["employee"] as const;

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GC";
}

export async function loadCompanyColleagues(
  supabase: SupabaseClient,
  userId: string,
  labels: { unassignedTeam: string }
): Promise<{ colleagues: ColleagueOption[]; companyName: string | null }> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, company:companies(company_name)")
    .eq("id", userId)
    .maybeSingle<{
      id: string;
      company_id: string | null;
      company: { company_name: string } | Array<{ company_name: string }> | null;
    }>();

  if (profileError || !profile?.company_id) {
    return { colleagues: [], companyName: null };
  }

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  const companyName = company?.company_name ?? null;

  const { data: companyProfiles, error: colleaguesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, profile_image, team_id, role, team:teams!profiles_team_id_fkey(name)")
    .eq("company_id", profile.company_id)
    .eq("status", "active")
    .neq("id", profile.id)
    .in("role", [...COLLEAGUE_ROLES])
    .order("first_name");

  if (colleaguesError) {
    console.warn("loadCompanyColleagues failed:", colleaguesError.message);
    return { colleagues: [], companyName };
  }

  const colleagues = (companyProfiles ?? [])
    .filter((person) => person.role && COLLEAGUE_ROLES.includes(person.role as (typeof COLLEAGUE_ROLES)[number]))
    .map((person) => {
      const team = Array.isArray(person.team) ? person.team[0] : person.team;
      return {
        id: person.id,
        name: `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim(),
        initials: getInitials(person.first_name ?? "", person.last_name ?? ""),
        team: team?.name ?? labels.unassignedTeam,
        email: person.email ?? undefined,
        imageUrl: person.profile_image
      };
    });

  return { colleagues, companyName };
}
