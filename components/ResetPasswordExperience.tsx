"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordExperience() {
  const t = useTranslations("resetPassword");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function finalizeAuthenticatedSession() {
    const response = await fetch("/auth/callback/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteToken: null })
    });
    const payload = (await response.json().catch(() => ({}))) as { redirectTo?: string };

    if (!response.ok || !payload.redirectTo) {
      window.location.assign("/login?error=password_updated");
      return;
    }

    window.location.assign(payload.redirectTo);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      if (password.length < 6) {
        throw new Error(t("errShort"));
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setStatus(t("updated"));
      await finalizeAuthenticatedSession();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("errUpdate"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>{t("title")}</h2>
      <p className="section-copy">{t("copy")}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="new-password">{t("newPassword")}</label>
          <div className="password-input-wrap">
            <input
              id="new-password"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder={t("placeholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? t("hidePassword") : t("showPassword")}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button className="btn btn-dark btn-full" disabled={busy} type="submit">
          {busy ? t("updating") : t("update")} <ArrowRight size={16} />
        </button>
      </form>

      {status ? (
        <p className="auth-status">
          <CheckCircle2 size={16} />
          {status}
        </p>
      ) : null}

      <div className="auth-links">
        <Link href="/login">{t("backToLogin")}</Link>
        <Link href="/">{t("backToSite")}</Link>
      </div>
    </div>
  );
}
