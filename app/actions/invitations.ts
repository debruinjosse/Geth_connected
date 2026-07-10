"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { InviteEmailError, sendInviteEmail, type InviteEmailErrorCode } from "@/lib/mail/nodemailer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InvitationActionState = {
  ok: boolean;
  message: string;
  inviteLink?: string;
  inviteEmail?: string;
  expiresAt?: string;
  emailSent?: boolean;
  emailErrorCode?: InviteEmailErrorCode;
};

const initialState: InvitationActionState = {
  ok: false,
  message: ""
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getRoleLabel(role: string) {
  return role === "manager" ? "Manager" : "Employee";
}

function getInviteLink(token: string) {
  return `${getAppUrl()}/invite/${token}`;
}

function getEmailFailureMessage(code?: InviteEmailErrorCode) {
  switch (code) {
    case "SMTP_MISSING":
      return "Invite created, but email could not be sent because SMTP is not configured. Copy the link or try resend after setup.";
    case "SMTP_AUTH_FAILED":
      return "Invite created, but email could not be sent because SMTP authentication failed. Copy the link or try resend after checking credentials.";
    case "SMTP_CONNECTION_FAILED":
      return "Invite created, but email could not be sent because the SMTP server could not be reached. Copy the link or try resend.";
    case "SMTP_SEND_FAILED":
      return "Invite created, but email could not be sent. Copy the link or try resend.";
    default:
      return "Invite created, but email could not be sent. Copy the link or try resend.";
  }
}

function logInviteEmailError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error("Failed to send invitation email", error);
  }
}

async function sendInvitationEmailSafely({
  email,
  role,
  companyName,
  token,
  expiresAt
}: {
  email: string;
  role: string;
  companyName: string;
  token: string;
  expiresAt: string;
}) {
  const inviteLink = getInviteLink(token);

  try {
    await sendInviteEmail({
      to: email,
      inviteLink,
      companyName,
      roleLabel: getRoleLabel(role),
      expiresAt
    });

    return { emailSent: true as const, inviteLink };
  } catch (error) {
    logInviteEmailError(error);
    return {
      emailSent: false as const,
      inviteLink,
      emailErrorCode: error instanceof InviteEmailError ? error.code : "UNKNOWN"
    };
  }
}

export async function createInvitationAction(
  _previousState: InvitationActionState = initialState,
  formData: FormData
): Promise<InvitationActionState> {
  if (!hasSupabaseServerConfig()) {
    return {
      ok: false,
      message: "Supabase must be configured before live invitations can be created."
    };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "").trim();
  const teamIdValue = String(formData.get("team_id") || "").trim();
  const teamId = teamIdValue || null;

  if (!email) {
    return { ok: false, message: "Enter a work email to create an invitation." };
  }

  if (!["employee", "manager"].includes(role)) {
    return { ok: false, message: "Invitations can only be created for employees or managers." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, message: "Please log in again before creating an invitation." };
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, role, company:companies(company_name)")
      .eq("id", user.id)
      .maybeSingle<{ id: string; company_id: string | null; role: string; company: { company_name: string } | Array<{ company_name: string }> | null }>();

    if (profileError || !adminProfile?.company_id || adminProfile.role !== "company_admin") {
      return { ok: false, message: "Only company admins can create invitations for this workspace." };
    }

    if (teamId) {
      const { data: teamRecord, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .eq("company_id", adminProfile.company_id)
        .maybeSingle<{ id: string }>();

      if (teamError || !teamRecord) {
        return { ok: false, message: "The selected team could not be found in this company." };
      }
    }

    const token = randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .insert({
        company_id: adminProfile.company_id,
        team_id: teamId,
        email,
        role,
        token,
        status: "pending",
        invited_by: adminProfile.id,
        expires_at: expiresAt
      })
      .select("token, expires_at")
      .single<{ token: string; expires_at: string }>();

    if (inviteError || !invitation) {
      return { ok: false, message: "We couldn't create that invitation yet. Please try again." };
    }

    const company = Array.isArray(adminProfile.company) ? adminProfile.company[0] : adminProfile.company;
    const companyName = company?.company_name ?? "your company";
    const emailResult = await sendInvitationEmailSafely({
      email,
      role,
      companyName,
      token: invitation.token,
      expiresAt: invitation.expires_at
    });

    revalidatePath("/company/employees");
    revalidatePath("/company/managers");

    return {
      ok: true,
      message: emailResult.emailSent
        ? "Invite created and email sent."
        : getEmailFailureMessage(emailResult.emailErrorCode),
      inviteLink: emailResult.inviteLink,
      inviteEmail: email,
      expiresAt,
      emailSent: emailResult.emailSent,
      emailErrorCode: emailResult.emailErrorCode
    };
  } catch {
    return {
      ok: false,
      message: "Something went wrong while creating the invitation."
    };
  }
}

export async function resendInvitationEmailAction(formData: FormData): Promise<InvitationActionState> {
  if (!hasSupabaseServerConfig()) {
    return { ok: false, message: "Supabase must be configured before invitation emails can be resent." };
  }

  const invitationId = String(formData.get("invitation_id") || "").trim();

  if (!invitationId) {
    return { ok: false, message: "Missing invitation selection." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, message: "Please log in again before resending an invitation." };
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, role, company:companies(company_name)")
      .eq("id", user.id)
      .maybeSingle<{ id: string; company_id: string | null; role: string; company: { company_name: string } | Array<{ company_name: string }> | null }>();

    if (profileError || !adminProfile?.company_id || adminProfile.role !== "company_admin") {
      return { ok: false, message: "Only company admins can resend invitations for this workspace." };
    }

    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select("id, email, role, token, status, expires_at")
      .eq("id", invitationId)
      .eq("company_id", adminProfile.company_id)
      .maybeSingle<{ id: string; email: string; role: string; token: string; status: string; expires_at: string }>();

    if (invitationError || !invitation) {
      return { ok: false, message: "That invitation could not be found." };
    }

    if (invitation.status !== "pending") {
      return { ok: false, message: "Only pending invitations can be resent." };
    }

    const expired = new Date(invitation.expires_at).getTime() < Date.now();
    if (expired) {
      await supabase.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
      revalidatePath("/company/employees");
      revalidatePath("/company/managers");
      return { ok: false, message: "This invitation has expired. Create a fresh invite instead." };
    }

    const company = Array.isArray(adminProfile.company) ? adminProfile.company[0] : adminProfile.company;
    const emailResult = await sendInvitationEmailSafely({
      email: invitation.email,
      role: invitation.role,
      companyName: company?.company_name ?? "your company",
      token: invitation.token,
      expiresAt: invitation.expires_at
    });

    return {
      ok: emailResult.emailSent,
      message: emailResult.emailSent
        ? "Invite created and email sent."
        : getEmailFailureMessage(emailResult.emailErrorCode),
      inviteLink: emailResult.inviteLink,
      inviteEmail: invitation.email,
      expiresAt: invitation.expires_at,
      emailSent: emailResult.emailSent,
      emailErrorCode: emailResult.emailErrorCode
    };
  } catch {
    return { ok: false, message: "Something went wrong while resending the invitation." };
  }
}
