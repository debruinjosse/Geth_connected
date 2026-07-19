import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

type InvitePageParams = {
  locale: string;
  token: string;
};

type InviteSearchParams = {
  status?: string;
  reason?: string;
  next?: string;
};

function getReasonCopy(reason?: string) {
  switch (reason) {
    case "invite_email_mismatch":
      return "This invitation belongs to a different email address. Log in with the invited address to continue.";
    case "invite_expired":
      return "This invitation has expired. Ask your company admin to generate a fresh invite link.";
    case "invite_revoked":
      return "This invitation was revoked. Reach out to your company admin for a new invite.";
    case "invite_not_found":
      return "We couldn't find this invitation token. Double-check the link or request a new invite.";
    default:
      return "We couldn't complete this invitation yet. Please try again or ask your admin for a fresh invite.";
  }
}

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<InvitePageParams>;
  searchParams: Promise<InviteSearchParams>;
}) {
  const { locale, token } = await params;
  const { status, reason, next } = await searchParams;

  if (!hasSupabaseServerConfig()) {
    return (
      <AuthShell eyebrow="Invitation onboarding" title="Invitations need Supabase" subtitle="Connect Supabase in this environment to generate and accept real company invitations.">
        <div className="auth-card">
          <p className="section-copy">Invite links are disabled until the Supabase environment variables are available in this project.</p>
          <Link className="btn btn-dark" href={`/${locale}/login`}>
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("id, email, role, status, expires_at, company:companies(company_name), team:teams(name)")
    .eq("token", token)
    .maybeSingle<{
      id: string;
      email: string;
      role: string;
      status: "pending" | "accepted" | "expired" | "revoked";
      expires_at: string;
      company: { company_name: string } | Array<{ company_name: string }> | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const company = Array.isArray(invitation?.company) ? invitation?.company[0] : invitation?.company;
  const team = Array.isArray(invitation?.team) ? invitation?.team[0] : invitation?.team;
  const invitedEmail = invitation?.email ?? "Unknown email";
  const sessionEmail = user?.email?.trim().toLowerCase();
  const inviteEmail = invitation?.email?.trim().toLowerCase();
  const loggedInWithMatchingEmail = Boolean(sessionEmail && inviteEmail && sessionEmail === inviteEmail);
  const isAccepted = status === "accepted" || invitation?.status === "accepted";
  const isError = status === "error";

  return (
    <AuthShell
      eyebrow="Invitation onboarding"
      title={isAccepted ? "Invitation accepted" : "You've been invited to GETH"}
      subtitle={
        isAccepted
          ? "Your company access is ready. Open your workspace whenever you're ready."
          : "Join your company workspace, claim recognitions, and keep appreciation visible across your team."
      }
    >
      <div className="auth-card invite-card">
        {invitation ? (
          <div className="invite-summary">
            <div className="quality-pill">{company?.company_name ?? "Company workspace"}</div>
            <h2 style={{ marginTop: 18 }}>{company?.company_name ?? "Company invite"}</h2>
            <p className="section-copy">
              This invitation is for <strong>{invitedEmail}</strong> as a <strong>{invitation.role.replace("_", " ")}</strong>
              {team?.name ? ` on ${team.name}.` : "."}
            </p>
          </div>
        ) : (
          <div className="invite-feedback error">
            <ShieldAlert size={18} />
            <span>We couldn&apos;t find an invitation that matches this token.</span>
          </div>
        )}

        {isAccepted ? (
          <div className="invite-success-stack">
            <div className="invite-feedback success">
              <CheckCircle2 size={18} />
              <span>Your profile has been attached to this company invitation.</span>
            </div>
            <Link className="btn btn-dark" href={next || `/${locale}/employee`}>
              Open workspace <ArrowRight size={16} />
            </Link>
          </div>
        ) : isError ? (
          <div className="invite-success-stack">
            <div className="invite-feedback error">
              <ShieldAlert size={18} />
              <span>{getReasonCopy(reason)}</span>
            </div>
            <div className="auth-links" style={{ marginTop: 0 }}>
              <Link href={`/${locale}/login?invite=${token}`}>Try logging in again</Link>
              <Link href={`/${locale}/signup?invite=${token}`}>Create account</Link>
            </div>
          </div>
        ) : invitation ? (
          <div className="invite-success-stack">
            <div className="invite-link-card">
              <div className="invite-link-meta">
                <strong>Invitation details</strong>
                <small>Expires {new Date(invitation.expires_at).toLocaleDateString()}</small>
              </div>
              <div className="invite-status-points">
                <span>
                  <Mail size={14} />
                  Invited email: {invitedEmail}
                </span>
                <span>Role: {invitation.role.replace("_", " ")}</span>
                <span>Team: {team?.name ?? "Assign later"}</span>
              </div>
            </div>

            {user ? (
              loggedInWithMatchingEmail ? (
                <Link className="btn btn-dark" href={`/auth/callback?invite=${token}`}>
                  Accept invitation <ArrowRight size={16} />
                </Link>
              ) : (
                <div className="invite-feedback error">
                  <ShieldAlert size={18} />
                  <span>You are logged in as {user.email}. Switch to {invitedEmail} to accept this invite.</span>
                </div>
              )
            ) : (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <Link className="btn btn-dark" href={`/${locale}/signup?invite=${token}`}>
                  Create account <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-secondary" href={`/${locale}/login?invite=${token}`}>
                  Log in
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="invite-success-stack">
            <div className="invite-feedback error">
              <ShieldAlert size={18} />
              <span>This invitation is no longer available.</span>
            </div>
            <Link className="btn btn-secondary" href={`/${locale}/login`}>
              Back to login
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
