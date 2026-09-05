"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TeamMutationResult = {
  ok: boolean;
  message: string;
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getCompanyAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, error: "Please log in again before managing teams." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; role: string }>();

  if (profileError || !profile?.company_id || profile.role !== "company_admin") {
    return { ok: false as const, error: "Only company admins can manage teams in this workspace." };
  }

  return { ok: true as const, supabase, profile };
}

async function validateManagerAssignment(
  managerId: string | null,
  companyId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  if (!managerId) {
    return { ok: true as const, managerId: null };
  }

  const { data: manager, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", managerId)
    .eq("company_id", companyId)
    .eq("role", "manager")
    .maybeSingle<{ id: string }>();

  if (error || !manager) {
    return { ok: false as const, error: "The selected manager could not be found in this company." };
  }

  return { ok: true as const, managerId };
}

function revalidateTeamSurfaces() {
  revalidatePath("/company");
  revalidatePath("/company/teams");
  revalidatePath("/company/employees");
  revalidatePath("/company/managers");
}

/** Role: `company_admin` only (via `getCompanyAdminContext`). Creates a new team, optionally assigning a manager. */
export async function createTeamAction(formData: FormData): Promise<TeamMutationResult> {
  if (!hasSupabaseServerConfig()) {
    return { ok: false, message: "Supabase must be configured before live teams can be created." };
  }

  const name = String(formData.get("name") || "").trim();
  const managerId = String(formData.get("manager_id") || "").trim() || null;

  if (!name) {
    return { ok: false, message: "Enter a team name before creating the team." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) {
    return { ok: false, message: context.error };
  }
  const companyId = context.profile.company_id!;

  const managerValidation = await validateManagerAssignment(managerId, companyId, context.supabase);
  if (!managerValidation.ok) {
    return { ok: false, message: managerValidation.error };
  }

  const { error } = await context.supabase.from("teams").insert({
    company_id: companyId,
    name,
    manager_id: managerValidation.managerId
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A team with that name already exists in this company." };
    }
    return { ok: false, message: "We couldn't create that team yet. Please try again." };
  }

  revalidateTeamSurfaces();
  return { ok: true, message: "Team created successfully." };
}

/** Role: `company_admin` only. Renames a team and/or reassigns its manager. */
export async function updateTeamAction(formData: FormData): Promise<TeamMutationResult> {
  if (!hasSupabaseServerConfig()) {
    return { ok: false, message: "Supabase must be configured before live teams can be updated." };
  }

  const teamId = String(formData.get("team_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const managerId = String(formData.get("manager_id") || "").trim() || null;

  if (!teamId) {
    return { ok: false, message: "Missing team selection." };
  }

  if (!name) {
    return { ok: false, message: "Enter a team name before saving changes." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) {
    return { ok: false, message: context.error };
  }
  const companyId = context.profile.company_id!;

  const { data: existingTeam, error: existingTeamError } = await context.supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("company_id", companyId)
    .maybeSingle<{ id: string }>();

  if (existingTeamError || !existingTeam) {
    return { ok: false, message: "That team could not be found in this company." };
  }

  const managerValidation = await validateManagerAssignment(managerId, companyId, context.supabase);
  if (!managerValidation.ok) {
    return { ok: false, message: managerValidation.error };
  }

  const { error } = await context.supabase
    .from("teams")
    .update({
      name,
      manager_id: managerValidation.managerId
    })
    .eq("id", teamId)
    .eq("company_id", companyId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A team with that name already exists in this company." };
    }
    return { ok: false, message: "We couldn't save those team changes yet. Please try again." };
  }

  revalidateTeamSurfaces();
  return { ok: true, message: "Team updated successfully." };
}

/** Role: `company_admin` only. Deletes a team from the caller's company. */
export async function deleteTeamAction(formData: FormData): Promise<TeamMutationResult> {
  if (!hasSupabaseServerConfig()) {
    return { ok: false, message: "Supabase must be configured before live teams can be deleted." };
  }

  const teamId = String(formData.get("team_id") || "").trim();

  if (!teamId) {
    return { ok: false, message: "Missing team selection." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) {
    return { ok: false, message: context.error };
  }
  const companyId = context.profile.company_id!;

  const { error } = await context.supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("company_id", companyId);

  if (error) {
    return { ok: false, message: "We couldn't delete that team yet. Please try again." };
  }

  revalidateTeamSurfaces();
  return { ok: true, message: "Team deleted successfully." };
}
