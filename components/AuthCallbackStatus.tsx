"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

async function finalizeAuth(inviteToken?: string | null, targetPath?: string | null, expectedRole?: string | null) {
  const response = await fetch("/auth/callback/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      inviteToken: inviteToken ?? null,
      targetPath: targetPath ?? null,
      expectedRole: expectedRole ?? null
    })
  });

  const payload = (await response.json().catch(() => null)) as { redirectTo?: string } | null;
  return payload?.redirectTo || "/login?error=profile_bootstrap_failed";
}

export function AuthCallbackStatus({ inviteToken, targetPath, expectedRole }: { inviteToken?: string; targetPath?: string; expectedRole?: string }) {
  const searchParams = useSearchParams();
  const t = useTranslations("authCallback");
  const [status, setStatus] = useState(t("completing"));

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const supabase = createSupabaseBrowserClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const hashParams = getHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType
          });

          if (error) {
            throw error;
          }
        }

        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw userError ?? new Error("No authenticated user was returned from Supabase.");
        }

        if (type === "recovery") {
          if (!cancelled) {
            setStatus(t("openingReset"));
            window.location.replace("/reset-password");
          }
          return;
        }

        const redirectTo = await finalizeAuth(inviteToken, targetPath, expectedRole);

        if (!cancelled) {
          setStatus(t("redirecting"));
          window.location.replace(redirectTo);
        }
      } catch {
        if (!cancelled) {
          window.location.replace("/login?error=auth_callback_failed");
        }
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [expectedRole, inviteToken, searchParams, t, targetPath]);

  return (
    <div className="auth-card">
      <div className="invite-feedback success">
        <LoaderCircle className="spin-soft" size={18} />
        <span>{status}</span>
      </div>
      <p className="section-copy">{t("copy")}</p>
    </div>
  );
}
