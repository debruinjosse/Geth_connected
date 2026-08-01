import type { User } from "@supabase/supabase-js";
import { bootstrapProfile, InvitationBootstrapError } from "@/lib/auth/bootstrap-profile";
import { normalizeAppRole, type AppRole } from "@/lib/auth/roles";

export function getExpectedRole(value: unknown): AppRole | null {
  if (
    value === "employee" ||
    value === "manager" ||
    value === "company_admin" ||
    value === "platform_admin" ||
    value === "super_admin"
  ) {
    return value;
  }

  return null;
}

export function rolesAreCompatible(expectedRole: AppRole, actualRole: AppRole) {
  if (expectedRole === "super_admin") {
    return actualRole === "super_admin" || actualRole === "platform_admin";
  }

  return expectedRole === actualRole;
}

export function getRoleMismatchRedirect(expectedRole: AppRole) {
  if (expectedRole === "super_admin" || expectedRole === "platform_admin") {
    return `/owner?error=role_mismatch`;
  }

  return `/login?error=role_mismatch&role=${expectedRole}`;
}

export async function resolveAuthCallbackRedirect(
  user: User,
  options: {
    inviteToken?: string | null;
    targetPath?: string | null;
    expectedRole?: string | null;
    origin?: string;
  }
) {
  const { inviteToken, targetPath, expectedRole, origin = "https://geth.pro" } = options;

  try {
    const { redirectTo, invitationApplied, role } = await bootstrapProfile(user, inviteToken);
    const requestedRole = getExpectedRole(expectedRole);
    const actualRole = normalizeAppRole(role);

    if (!inviteToken && requestedRole && !rolesAreCompatible(requestedRole, actualRole)) {
      return {
        redirectTo: getRoleMismatchRedirect(requestedRole),
        status: 403 as const
      };
    }

    const safeTargetPath =
      targetPath &&
      targetPath.startsWith("/") &&
      !targetPath.startsWith("//") &&
      !targetPath.startsWith("/api") &&
      !targetPath.startsWith("/auth")
        ? targetPath
        : "";
    const finalRedirect =
      safeTargetPath === redirectTo || safeTargetPath.startsWith(`${redirectTo}/`) ? safeTargetPath : redirectTo;

    if (inviteToken && invitationApplied) {
      const inviteUrl = new URL(`/invite/${inviteToken}`, origin);
      inviteUrl.searchParams.set("status", "accepted");
      inviteUrl.searchParams.set("next", finalRedirect);
      return {
        redirectTo: `${inviteUrl.pathname}${inviteUrl.search}`,
        status: 200 as const
      };
    }

    return { redirectTo: finalRedirect, status: 200 as const };
  } catch (error) {
    if (inviteToken && error instanceof InvitationBootstrapError) {
      const inviteUrl = new URL(`/invite/${inviteToken}`, origin);
      inviteUrl.searchParams.set("status", "error");
      inviteUrl.searchParams.set("reason", error.code.toLowerCase());
      return { redirectTo: `${inviteUrl.pathname}${inviteUrl.search}`, status: 400 as const };
    }

    return { redirectTo: "/login?error=profile_bootstrap_failed", status: 400 as const };
  }
}
