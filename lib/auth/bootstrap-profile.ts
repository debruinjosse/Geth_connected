import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getRouteForAppRole, normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { createNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileRecord = {
  id: string;
  company_id: string | null;
  role: AppRole;
  team_id?: string | null;
  department_id?: string | null;
};

type InvitationRecord = {
  id: string;
  company_id: string;
  team_id: string | null;
  department_id: string | null;
  email: string;
  role: AppRole;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  accepted_at: string | null;
  token: string;
};

export class InvitationBootstrapError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "InvitationBootstrapError";
  }
}

function splitFullName(fullName: string | null | undefined, email: string) {
  const fallback = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "New User";
  const source = (fullName || fallback).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "New";
  const lastName = parts.slice(1).join(" ") || "User";
  return { firstName, lastName };
}

function slugifyCompanyName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "geth-workspace";
}

function getFallbackCompanyName(email: string) {
  const domain = email.split("@")[1]?.trim().toLowerCase();

  if (!domain) {
    return "GETH Workspace";
  }

  const domainName = domain.split(".")[0]?.replace(/[._-]+/g, " ").trim();
  if (!domainName) {
    return "GETH Workspace";
  }

  return `${domainName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ")} Workspace`;
}

async function findOrCreateCompany(admin: SupabaseClient, companyName: string) {
  const slug = slugifyCompanyName(companyName);
  const { data: existingCompany, error: companyLookupError } = await admin
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (companyLookupError) {
    throw companyLookupError;
  }

  if (existingCompany) {
    return existingCompany.id;
  }

  const { data: createdCompany, error: companyCreateError } = await admin
    .from("companies")
    .insert({
      company_name: companyName,
      slug,
      status: "demo"
    })
    .select("id")
    .single();

  if (companyCreateError) {
    throw companyCreateError;
  }

  return createdCompany.id;
}

async function loadInvitation(admin: SupabaseClient, token: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: invitation, error } = await admin
    .from("invitations")
    .select("id, company_id, team_id, department_id, email, role, status, expires_at, accepted_at, token")
    .eq("token", token)
    .maybeSingle<InvitationRecord>();

  if (error) {
    throw error;
  }

  if (!invitation) {
    throw new InvitationBootstrapError("INVITE_NOT_FOUND");
  }

  if (invitation.email.trim().toLowerCase() !== normalizedEmail) {
    throw new InvitationBootstrapError("INVITE_EMAIL_MISMATCH");
  }

  if (invitation.status === "accepted") {
    return { invitation, alreadyAccepted: true };
  }

  if (invitation.status === "revoked") {
    throw new InvitationBootstrapError("INVITE_REVOKED");
  }

  const expired = new Date(invitation.expires_at).getTime() < Date.now();
  if (expired) {
    if (invitation.status === "pending") {
      await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    }
    throw new InvitationBootstrapError("INVITE_EXPIRED");
  }

  if (invitation.status !== "pending") {
    throw new InvitationBootstrapError("INVITE_NOT_PENDING");
  }

  return { invitation, alreadyAccepted: false };
}

async function markInvitationAccepted(admin: SupabaseClient, invitationId: string) {
  const timestamp = new Date().toISOString();
  const { error } = await admin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: timestamp
    })
    .eq("id", invitationId);

  if (error) {
    throw error;
  }
}

async function notifyInvitationAccepted(
  admin: SupabaseClient,
  invitation: InvitationRecord,
  acceptedUser: User
) {
  const acceptedEmail = acceptedUser.email ?? invitation.email;
  const { data: companyAdmins } = await admin
    .from("profiles")
    .select("id")
    .eq("company_id", invitation.company_id)
    .eq("role", "company_admin")
    .eq("status", "active");

  const notifyUserIds = new Set<string>((companyAdmins ?? []).map((profile) => profile.id));

  if (invitation.team_id) {
    const { data: team } = await admin
      .from("teams")
      .select("manager_id")
      .eq("id", invitation.team_id)
      .maybeSingle<{ manager_id: string | null }>();

    if (team?.manager_id) {
      notifyUserIds.add(team.manager_id);
    }
  }

  await Promise.all(
    Array.from(notifyUserIds).map((userId) =>
      createNotification(admin, {
        userId,
        companyId: invitation.company_id,
        type: "invite_accepted",
        title: "Invitation accepted",
        body: `${acceptedEmail} joined as ${invitation.role.replace("_", " ")}.`,
        href: invitation.role === "manager" ? "/company/managers" : "/company/employees"
      })
    )
  );
}

async function applyInvitationToExistingProfile(admin: SupabaseClient, profileId: string, invitation: InvitationRecord) {
  const { data: updatedProfile, error } = await admin
    .from("profiles")
    .update({
      company_id: invitation.company_id,
      team_id: invitation.team_id,
      department_id: invitation.department_id,
      role: invitation.role,
      status: "active"
    })
    .eq("id", profileId)
    .select("id, company_id, role, team_id, department_id")
    .single<ProfileRecord>();

  if (error) {
    throw error;
  }

  await markInvitationAccepted(admin, invitation.id);
  return updatedProfile;
}

export async function bootstrapProfile(user: User, invitationToken?: string | null) {
  const admin = createSupabaseAdminClient();
  const inviteContext = invitationToken && user.email ? await loadInvitation(admin, invitationToken, user.email) : null;

  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id, company_id, role, team_id, department_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  if (existingProfileError) {
    throw existingProfileError;
  }

  if (existingProfile) {
    const profile = inviteContext && !inviteContext.alreadyAccepted ? await applyInvitationToExistingProfile(admin, existingProfile.id, inviteContext.invitation) : existingProfile;
    if (inviteContext && !inviteContext.alreadyAccepted) {
      await notifyInvitationAccepted(admin, inviteContext.invitation, user);
    }
    const role = normalizeAppRole(profile.role);
    return {
      profile,
      role,
      redirectTo: getRouteForAppRole(role),
      invitationApplied: Boolean(inviteContext),
      invitationToken: invitationToken ?? null
    };
  }

  if (!user.email) {
    throw new Error("Authenticated user email is missing.");
  }

  const metadata = user.user_metadata ?? {};
  const metadataRole = normalizeAppRole(metadata.role);
  const companyName = typeof metadata.company === "string" ? metadata.company.trim() : "";
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : null;
  const { firstName, lastName } = splitFullName(fullName, user.email);

  let companyId: string | null = null;
  let teamId: string | null = null;
  let departmentId: string | null = null;
  let role: AppRole = metadataRole;

  if (inviteContext) {
    companyId = inviteContext.invitation.company_id;
    teamId = inviteContext.invitation.team_id;
    departmentId = inviteContext.invitation.department_id;
    role = normalizeAppRole(inviteContext.invitation.role);
  } else if (role !== "platform_admin" && role !== "super_admin") {
    companyId = await findOrCreateCompany(admin, companyName || getFallbackCompanyName(user.email));
  }

  const { data: createdProfile, error: createProfileError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      company_id: companyId,
      team_id: teamId,
      department_id: departmentId,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      role,
      status: "active"
    })
    .select("id, company_id, role, team_id, department_id")
    .single<ProfileRecord>();

  if (createProfileError) {
    throw createProfileError;
  }

  if (inviteContext && !inviteContext.alreadyAccepted) {
    await markInvitationAccepted(admin, inviteContext.invitation.id);
    await notifyInvitationAccepted(admin, inviteContext.invitation, user);
  }

  return {
    profile: createdProfile,
    role,
    redirectTo: getRouteForAppRole(role),
    invitationApplied: Boolean(inviteContext),
    invitationToken: invitationToken ?? null
  };
}
