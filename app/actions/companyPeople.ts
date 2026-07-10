"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CompanyPeopleMutationResult = {
  ok: boolean;
  message: string;
};

async function getCompanyAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, message: "Please log in again before managing people." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; role: string }>();

  if (profileError || !profile?.company_id || profile.role !== "company_admin") {
    return { ok: false as const, message: "Only company admins can manage people in this workspace." };
  }

  return { ok: true as const, supabase, profile };
}

function revalidatePeopleSurfaces() {
  revalidatePath("/company");
  revalidatePath("/company/employees");
  revalidatePath("/company/managers");
  revalidatePath("/company/teams");
}

async function validateCompanyTeam(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  companyId: string,
  teamId: string | null
) {
  if (!teamId) return { ok: true as const };

  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("company_id", companyId)
    .maybeSingle<{ id: string }>();

  if (error || !team) {
    return { ok: false as const, message: "The selected team could not be found in this company." };
  }

  return { ok: true as const };
}

export async function updateProfileTeamAction(formData: FormData): Promise<CompanyPeopleMutationResult> {
  const profileId = String(formData.get("profile_id") || "").trim();
  const teamId = String(formData.get("team_id") || "").trim() || null;
  const role = String(formData.get("role") || "").trim();

  if (!profileId || !["employee", "manager"].includes(role)) {
    return { ok: false, message: "Missing profile selection." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) return { ok: false, message: context.message };

  const teamValidation = await validateCompanyTeam(context.supabase, context.profile.company_id!, teamId);
  if (!teamValidation.ok) return { ok: false, message: teamValidation.message };

  const { error } = await context.supabase
    .from("profiles")
    .update({ team_id: teamId })
    .eq("id", profileId)
    .eq("company_id", context.profile.company_id!)
    .eq("role", role);

  if (error) {
    return { ok: false, message: "We could not update that team assignment yet." };
  }

  revalidatePeopleSurfaces();
  return { ok: true, message: "Team assignment updated." };
}

export async function updateProfileStatusAction(formData: FormData): Promise<CompanyPeopleMutationResult> {
  const profileId = String(formData.get("profile_id") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!profileId || !["employee", "manager"].includes(role) || !["active", "disabled"].includes(status)) {
    return { ok: false, message: "Missing profile status selection." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) return { ok: false, message: context.message };

  const { error } = await context.supabase
    .from("profiles")
    .update({ status })
    .eq("id", profileId)
    .eq("company_id", context.profile.company_id!)
    .eq("role", role);

  if (error) {
    return { ok: false, message: "We could not update that profile status yet." };
  }

  revalidatePeopleSurfaces();
  return { ok: true, message: status === "active" ? "Profile reactivated." : "Profile disabled." };
}

export async function assignManagerToTeamAction(formData: FormData): Promise<CompanyPeopleMutationResult> {
  const managerId = String(formData.get("manager_id") || "").trim();
  const teamId = String(formData.get("team_id") || "").trim();

  if (!managerId || !teamId) {
    return { ok: false, message: "Choose a manager and team before assigning." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) return { ok: false, message: context.message };

  const [{ data: manager, error: managerError }, teamValidation] = await Promise.all([
    context.supabase
      .from("profiles")
      .select("id")
      .eq("id", managerId)
      .eq("company_id", context.profile.company_id!)
      .eq("role", "manager")
      .maybeSingle<{ id: string }>(),
    validateCompanyTeam(context.supabase, context.profile.company_id!, teamId)
  ]);

  if (managerError || !manager) {
    return { ok: false, message: "The selected manager could not be found in this company." };
  }

  if (!teamValidation.ok) return { ok: false, message: teamValidation.message };

  const { error } = await context.supabase
    .from("teams")
    .update({ manager_id: managerId })
    .eq("id", teamId)
    .eq("company_id", context.profile.company_id!);

  if (error) {
    return { ok: false, message: "We could not assign that manager yet." };
  }

  revalidatePeopleSurfaces();
  return { ok: true, message: "Manager assigned to team." };
}

export async function removeManagerFromTeamAction(formData: FormData): Promise<CompanyPeopleMutationResult> {
  const teamId = String(formData.get("team_id") || "").trim();

  if (!teamId) {
    return { ok: false, message: "Choose a team before removing the manager." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) return { ok: false, message: context.message };

  const { error } = await context.supabase
    .from("teams")
    .update({ manager_id: null })
    .eq("id", teamId)
    .eq("company_id", context.profile.company_id!);

  if (error) {
    return { ok: false, message: "We could not remove that manager assignment yet." };
  }

  revalidatePeopleSurfaces();
  return { ok: true, message: "Manager removed from team." };
}

export async function revokeInvitationAction(formData: FormData): Promise<CompanyPeopleMutationResult> {
  const invitationId = String(formData.get("invitation_id") || "").trim();

  if (!invitationId) {
    return { ok: false, message: "Missing invitation selection." };
  }

  const context = await getCompanyAdminContext();
  if (!context.ok) return { ok: false, message: context.message };

  const { error } = await context.supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("company_id", context.profile.company_id!)
    .eq("status", "pending");

  if (error) {
    return { ok: false, message: "We could not revoke that invitation yet." };
  }

  revalidatePeopleSurfaces();
  return { ok: true, message: "Invitation revoked." };
}
