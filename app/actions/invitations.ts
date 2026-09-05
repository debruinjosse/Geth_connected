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

export type BulkEmployeeImportState = {
  ok: boolean;
  message: string;
  createdInvites?: number;
  skippedRows?: number;
  teamsTouched?: number;
  managerInvites?: number;
  emailSent?: number;
  emailFailed?: number;
  errors?: string[];
};

const initialState: InvitationActionState = {
  ok: false,
  message: ""
};

const bulkInitialState: BulkEmployeeImportState = {
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

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    return {
      rowNumber: index + 2,
      data: Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex]?.trim() ?? ""]))
    };
  });
}

function getCsvValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value) return value.trim();
  }

  return "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

/** Role: `company_admin` only. Creates and emails one employee/manager invitation for the caller's company. */
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
  let departmentId: string | null = null;

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
        .select("id, department_id")
        .eq("id", teamId)
        .eq("company_id", adminProfile.company_id)
        .maybeSingle<{ id: string; department_id: string | null }>();

      if (teamError || !teamRecord) {
        return { ok: false, message: "The selected team could not be found in this company." };
      }

      departmentId = teamRecord.department_id;
    }

    const token = randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .insert({
        company_id: adminProfile.company_id,
        team_id: teamId,
        department_id: departmentId,
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

/**
 * Role: `company_admin` only. Parses an uploaded CSV (email/role/department/manager columns),
 * creating any missing departments/teams and one invitation per new row, optionally emailing each.
 */
export async function bulkImportEmployeesAction(
  _previousState: BulkEmployeeImportState = bulkInitialState,
  formData: FormData
): Promise<BulkEmployeeImportState> {
  if (!hasSupabaseServerConfig()) {
    return { ok: false, message: "Supabase must be configured before bulk import can run." };
  }

  const file = formData.get("csv_file");
  const shouldSendEmails = formData.get("send_emails") === "on";

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Upload a CSV file before importing employees." };
  }

  if (file.size > 1_000_000) {
    return { ok: false, message: "CSV file is too large. Please upload a file under 1 MB." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, message: "Please log in again before importing employees." };
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, role, company:companies(company_name)")
      .eq("id", user.id)
      .maybeSingle<{ id: string; company_id: string | null; role: string; company: { company_name: string } | Array<{ company_name: string }> | null }>();

    if (profileError || !adminProfile?.company_id || adminProfile.role !== "company_admin") {
      return { ok: false, message: "Only company admins can bulk import employees for this workspace." };
    }

    const companyId = adminProfile.company_id;
    const invitedBy = adminProfile.id;
    const csvText = await file.text();
    const rows = parseCsv(csvText);

    if (!rows.length) {
      return {
        ok: false,
        message: "No employee rows were found. Include a header row and at least one employee row."
      };
    }

    const company = Array.isArray(adminProfile.company) ? adminProfile.company[0] : adminProfile.company;
    const companyName = company?.company_name ?? "your company";
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const teamCache = new Map<string, string>();
    const departmentCache = new Map<string, string>();
    const pendingInviteKeys = new Set<string>();
    const profileEmails = new Set<string>();
    const errors: string[] = [];
    let createdInvites = 0;
    let skippedRows = 0;
    let teamsTouched = 0;
    let managerInvites = 0;
    let emailSent = 0;
    let emailFailed = 0;

    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("email")
      .eq("company_id", companyId);

    for (const profile of existingProfiles ?? []) {
      if (profile.email) profileEmails.add(String(profile.email).toLowerCase());
    }

    const { data: pendingInvites } = await supabase
      .from("invitations")
      .select("email, role, status")
      .eq("company_id", companyId)
      .eq("status", "pending");

    for (const invite of pendingInvites ?? []) {
      pendingInviteKeys.add(`${String(invite.email).toLowerCase()}::${invite.role}`);
    }

    async function getOrCreateDepartmentId(departmentNameRaw: string) {
      const departmentName = departmentNameRaw.trim();
      if (!departmentName) return null;
      const cacheKey = departmentName.toLowerCase();
      const cached = departmentCache.get(cacheKey);
      if (cached) return cached;

      const { data: existingDepartment, error: existingError } = await supabase
        .from("departments")
        .select("id")
        .eq("company_id", companyId)
        .ilike("name", departmentName)
        .maybeSingle<{ id: string }>();

      if (!existingError && existingDepartment?.id) {
        departmentCache.set(cacheKey, existingDepartment.id);
        return existingDepartment.id;
      }

      const { data: department, error: departmentError } = await supabase
        .from("departments")
        .insert({ company_id: companyId, name: departmentName })
        .select("id")
        .single<{ id: string }>();

      if (departmentError || !department) {
        errors.push(`Could not create department "${departmentName}".`);
        return null;
      }

      departmentCache.set(cacheKey, department.id);
      return department.id;
    }

    async function getOrCreateTeamId(teamNameRaw: string, departmentId: string | null) {
      const teamName = teamNameRaw.trim();
      if (!teamName) return null;
      const cacheKey = teamName.toLowerCase();
      const cached = teamCache.get(cacheKey);
      if (cached) return cached;

      const { data: existingTeam, error: existingError } = await supabase
        .from("teams")
        .select("id")
        .eq("company_id", companyId)
        .ilike("name", teamName)
        .maybeSingle<{ id: string }>();

      if (!existingError && existingTeam?.id) {
        if (departmentId) {
          await supabase.from("teams").update({ department_id: departmentId }).eq("id", existingTeam.id).is("department_id", null);
        }
        teamCache.set(cacheKey, existingTeam.id);
        return existingTeam.id;
      }

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ company_id: companyId, name: teamName, department_id: departmentId })
        .select("id")
        .single<{ id: string }>();

      if (teamError || !team) {
        errors.push(`Could not create department "${teamName}".`);
        return null;
      }

      teamsTouched += 1;
      teamCache.set(cacheKey, team.id);
      return team.id;
    }

    async function createInvite(email: string, role: "employee" | "manager", teamId: string | null, departmentId: string | null) {
      const normalizedEmail = email.trim().toLowerCase();
      const key = `${normalizedEmail}::${role}`;

      if (profileEmails.has(normalizedEmail) || pendingInviteKeys.has(key)) {
        skippedRows += 1;
        return;
      }

      const token = randomUUID().replace(/-/g, "");
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .insert({
          company_id: companyId,
          team_id: teamId,
          department_id: departmentId,
          email: normalizedEmail,
          role,
          token,
          status: "pending",
          invited_by: invitedBy,
          expires_at: expiresAt
        })
        .select("token, expires_at")
        .single<{ token: string; expires_at: string }>();

      if (inviteError || !invitation) {
        errors.push(`Could not create ${role} invite for ${normalizedEmail}.`);
        return;
      }

      pendingInviteKeys.add(key);
      createdInvites += 1;
      if (role === "manager") managerInvites += 1;

      if (shouldSendEmails) {
        const emailResult = await sendInvitationEmailSafely({
          email: normalizedEmail,
          role,
          companyName,
          token: invitation.token,
          expiresAt: invitation.expires_at
        });

        if (emailResult.emailSent) emailSent += 1;
        else emailFailed += 1;
      }
    }

    for (const { rowNumber, data } of rows) {
      const email = getCsvValue(data, ["email", "work_email", "employee_email"]);
      const roleValue = getCsvValue(data, ["role"]).toLowerCase();
      const department = getCsvValue(data, ["department", "team", "team_name"]);
      const managerEmail = getCsvValue(data, ["manager_email", "manager"]);

      if (!email || !isEmail(email)) {
        skippedRows += 1;
        errors.push(`Row ${rowNumber}: missing or invalid employee email.`);
        continue;
      }

      const role = roleValue === "manager" ? "manager" : "employee";
      const departmentId = await getOrCreateDepartmentId(department);
      const teamId = await getOrCreateTeamId(department, departmentId);
      await createInvite(email, role, teamId, departmentId);

      if (managerEmail && isEmail(managerEmail)) {
        await createInvite(managerEmail, "manager", teamId, departmentId);
      }

    }

    revalidatePath("/company/employees");
    revalidatePath("/company/managers");
    revalidatePath("/company/teams");

    return {
      ok: createdInvites > 0,
      message:
        createdInvites > 0
          ? `Bulk import complete: ${createdInvites} invite${createdInvites === 1 ? "" : "s"} created.`
          : "Bulk import finished, but no new invites were created.",
      createdInvites,
      skippedRows,
      teamsTouched,
      managerInvites,
      emailSent,
      emailFailed,
      errors: errors.slice(0, 8)
    };
  } catch {
    return {
      ok: false,
      message: "Something went wrong while importing the CSV file."
    };
  }
}

/** Role: `company_admin` only. Resends a still-pending invitation's email, or expires it in place if its deadline has passed. */
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
