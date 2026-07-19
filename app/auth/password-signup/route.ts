import { NextRequest, NextResponse } from "next/server";
import { bootstrapProfile, InvitationBootstrapError } from "@/lib/auth/bootstrap-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PasswordSignupBody = {
  email?: string;
  password?: string;
  fullName?: string;
  company?: string;
  role?: string;
  inviteToken?: string | null;
};

function normalizeRole(value: string | undefined) {
  return value === "company_admin" ? "company_admin" : "employee";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PasswordSignupBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const role = normalizeRole(body.role);

  if (!email || !isValidEmail(email) || !password || password.length < 6) {
    return NextResponse.json({ error: "Enter a valid email and a password with at least 6 characters." }, { status: 400 });
  }

  if (role === "company_admin" && !body.company?.trim()) {
    return NextResponse.json({ error: "Company name is required for company admin signup." }, { status: 400 });
  }

  if (role === "employee" && !body.inviteToken) {
    return NextResponse.json({ error: "Employees must join through a company invitation link. Ask your company admin to invite you." }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: body.fullName?.trim() || "New User",
        company: body.company?.trim() || "GETH Workspace",
        role
      }
    });

    if (createError || !created.user) {
      const errorMessage = createError?.message ?? "";
      const lowerMessage = errorMessage.toLowerCase();
      const errorStatus = (createError as { status?: number } | null)?.status;
      const isExistingAccount =
        errorStatus === 422 ||
        lowerMessage.includes("already") ||
        lowerMessage.includes("registered") ||
        lowerMessage.includes("exists") ||
        lowerMessage.includes("duplicate");
      const message = isExistingAccount
        ? "An account already exists for this email. Please log in or use Reset password."
        : errorMessage || "We could not create this account.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const bootstrap = await bootstrapProfile(created.user, body.inviteToken ?? null);
    return NextResponse.json({ ok: true, redirectTo: bootstrap.redirectTo });
  } catch (error) {
    if (error instanceof InvitationBootstrapError) {
      return NextResponse.json({ error: error.code.replaceAll("_", " ").toLowerCase() }, { status: 400 });
    }

    return NextResponse.json({ error: "Account was created but profile setup failed. Check Supabase service role and profile policies." }, { status: 500 });
  }
}
