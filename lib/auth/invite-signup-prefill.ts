import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DemoRole } from "@/lib/demo-session";

export type InviteSignupPrefill = {
  email: string;
  companyName: string;
  role: DemoRole;
};

function normalizeInviteRole(role: string | null | undefined): DemoRole {
  if (role === "manager" || role === "company_admin") {
    return role;
  }

  return "employee";
}

export async function loadInviteSignupPrefill(token: string): Promise<InviteSignupPrefill | null> {
  if (!token.trim()) {
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: invitation } = await admin
      .from("invitations")
      .select("email, role, status, company:companies(company_name)")
      .eq("token", token)
      .maybeSingle<{
        email: string;
        role: string;
        status: "pending" | "accepted" | "expired" | "revoked";
        company: { company_name: string } | Array<{ company_name: string }> | null;
      }>();

    if (!invitation?.email || invitation.status !== "pending") {
      return null;
    }

    const company = Array.isArray(invitation.company) ? invitation.company[0] : invitation.company;

    return {
      email: invitation.email,
      companyName: company?.company_name?.trim() ?? "",
      role: normalizeInviteRole(invitation.role)
    };
  } catch {
    return null;
  }
}
