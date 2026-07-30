"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendInviteEmail } from "@/lib/mail/nodemailer";
import { createPlatformAdminNotifications } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, supabase, message: "Please log in again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    return { ok: false as const, supabase, message: "You do not have platform admin access." };
  }

  return { ok: true as const, supabase, user, message: "Authorized." };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

async function buildUniqueCompanySlug(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, requestedSlug: string) {
  const baseSlug = slugify(requestedSlug) || `company-${crypto.randomUUID().slice(0, 8)}`;
  const { data: existing } = await supabase.from("companies").select("slug").eq("slug", baseSlug).maybeSingle<{ slug: string }>();

  if (!existing) {
    return baseSlug;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

async function createInvite({
  supabase,
  companyId,
  teamId,
  email,
  role,
  invitedBy
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  companyId: string;
  teamId: string | null;
  email: string;
  role: "company_admin" | "manager" | "employee";
  invitedBy: string;
}) {
  if (!email) return null;

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
    company_id: companyId,
    team_id: teamId,
    email,
    role,
    token: crypto.randomUUID(),
    status: "pending",
    invited_by: invitedBy,
    expires_at: expiresAt
    })
    .select("token, expires_at")
    .single<{ token: string; expires_at: string }>();

  if (error || !invitation) {
    throw new Error(`Failed to create ${role.replace("_", " ")} invite.`);
  }

  return invitation;
}

function getInviteBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function getRoleLabel(role: string) {
  return role.replace("_", " ");
}

function getActionLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "nl").trim();
  return ["nl", "en"].includes(locale) ? locale : "nl";
}

export async function createCompanyWorkspaceAction(formData: FormData) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return;
  }

  const companyName = String(formData.get("companyName") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim() || companyName;
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const subscriptionPlan = String(formData.get("subscriptionPlan") ?? "growth").trim() || "growth";
  const companyAdminEmail = normalizeEmail(formData.get("companyAdminEmail"));
  const managerEmail = normalizeEmail(formData.get("managerEmail"));
  const teamName = String(formData.get("teamName") ?? "").trim();
  const locale = getActionLocale(formData);

  if (!companyName || !companyAdminEmail) {
    return;
  }

  const slug = await buildUniqueCompanySlug(auth.supabase, requestedSlug);
  const { data: company, error: companyError } = await auth.supabase
    .from("companies")
    .insert({
      company_name: companyName,
      slug,
      industry,
      subscription_plan: subscriptionPlan,
      status: "active"
    })
    .select("id")
    .single<{ id: string }>();

  if (companyError || !company) {
    return;
  }

  let managerTeamId: string | null = null;
  if (teamName) {
    const { data: team, error: teamError } = await auth.supabase
      .from("teams")
      .insert({
        company_id: company.id,
        name: teamName
      })
      .select("id")
      .single<{ id: string }>();

    if (!teamError && team) {
      managerTeamId = team.id;
    }
  }

  await createInvite({
    supabase: auth.supabase,
    companyId: company.id,
    teamId: null,
    email: companyAdminEmail,
    role: "company_admin",
    invitedBy: auth.user.id
  });

  if (managerEmail) {
    await createInvite({
      supabase: auth.supabase,
      companyId: company.id,
      teamId: managerTeamId,
      email: managerEmail,
      role: "manager",
      invitedBy: auth.user.id
    });
  }

  await createPlatformAdminNotifications(auth.supabase, {
    companyId: company.id,
    type: "company_created",
    title: "New company workspace created",
    body: `${companyName} was created with the ${subscriptionPlan} plan. Confirm billing, then send the first company admin invite if needed.`,
    href: `/admin/companies/${company.id}`
  });

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  redirect(`/${locale}/admin/companies/${company.id}?created=1`);
}

export async function updateCompanyStatusAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!companyId || !["active", "inactive", "demo"].includes(status)) {
    return;
  }

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return;
  }

  const { error } = await auth.supabase.from("companies").update({ status }).eq("id", companyId);

  if (error) {
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
}

export async function createCompanyInviteFromAdminAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const role = String(formData.get("role") ?? "").trim() as "company_admin" | "manager" | "employee";
  const returnTo = String(formData.get("returnTo") ?? `/admin/companies/${companyId}`);
  const locale = getActionLocale(formData);

  if (!companyId || !email || !["company_admin", "manager", "employee"].includes(role)) {
    redirect(`${returnTo}?invite=invalid`);
  }

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    redirect(`${returnTo}?invite=unauthorized`);
  }

  const { data: company } = await auth.supabase
    .from("companies")
    .select("company_name")
    .eq("id", companyId)
    .maybeSingle<{ company_name: string }>();

  const invitation = await createInvite({
    supabase: auth.supabase,
    companyId,
    teamId: null,
    email,
    role,
    invitedBy: auth.user.id
  });

  if (invitation) {
    try {
      await sendInviteEmail({
        to: email,
        inviteLink: `${getInviteBaseUrl()}/${locale}/invite/${invitation.token}`,
        companyName: company?.company_name ?? "this company",
        roleLabel: getRoleLabel(role),
        expiresAt: invitation.expires_at
      });
    } catch {
      revalidatePath("/admin/companies");
      revalidatePath(`/admin/companies/${companyId}`);
      redirect(`${returnTo}?invite=created-email-failed`);
    }
  }

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  redirect(`${returnTo}?invite=created`);
}

export async function updateCardActiveAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!cardId) {
    return;
  }

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return;
  }

  const { error } = await auth.supabase.from("card_library").update({ active }).eq("id", cardId);

  if (error) {
    return;
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/qr-routes");
  revalidatePath("/cards");
}

export async function updateCardContentAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const recognitionSentence = String(formData.get("recognitionSentence") ?? "").trim();

  if (!cardId || !title || !category || !description || !recognitionSentence) {
    return;
  }

  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return;
  }

  const { error } = await auth.supabase
    .from("card_library")
    .update({
      title,
      category,
      description,
      recognition_sentence: recognitionSentence
    })
    .eq("id", cardId);

  if (error) {
    return;
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/qr-routes");
  revalidatePath("/company/cards");
  revalidatePath("/company/reports");
  revalidatePath("/manager");
  revalidatePath("/manager/analytics");
  revalidatePath("/manager/reports");
  revalidatePath("/employee");
  revalidatePath("/employee/cards");
  revalidatePath("/employee/growth");
  revalidatePath("/employee/messages");
  revalidatePath("/cards");
}
