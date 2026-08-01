import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { AuthCallbackStatus } from "@/components/AuthCallbackStatus";

type CallbackSearchParams = {
  invite?: string;
  next?: string;
  role?: string;
  token_hash?: string;
  type?: string;
  code?: string;
};

const AUTH_VERIFY_QUERY_KEYS = ["token_hash", "type", "code", "role", "next", "invite"] as const;

function buildAuthVerifyRedirect(params: CallbackSearchParams) {
  const query = new URLSearchParams();

  for (const key of AUTH_VERIFY_QUERY_KEYS) {
    const value = params[key];
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `/auth/verify?${queryString}` : "/auth/verify";
}

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<CallbackSearchParams>;
}) {
  const params = await searchParams;

  if (params.token_hash || params.code) {
    redirect(buildAuthVerifyRedirect(params));
  }

  const { invite, next, role } = params;

  return (
    <AuthShell
      eyebrow="Secure sign-in"
      title="Finishing your sign-in"
      subtitle="We are connecting your magic link, profile, and workspace access right now."
    >
      <Suspense
        fallback={
          <div className="auth-card">
            <div className="invite-feedback success">
              <span>Completing your secure sign-in...</span>
            </div>
          </div>
        }
      >
        <AuthCallbackStatus expectedRole={role} inviteToken={invite} targetPath={next} />
      </Suspense>
    </AuthShell>
  );
}
