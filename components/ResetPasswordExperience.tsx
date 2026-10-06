"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Fields";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function ResetPasswordExperience() {
  const t = useTranslations("resetPassword");
  const [password, setPassword] = useState("");
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
    <Card size="lg" className="lp-auth-card">
      <h2>{t("title")}</h2>
      <p className="lp-sub">{t("copy")}</p>

      <form className="lp-form" onSubmit={handleSubmit}>
        <Field label={t("newPassword")} htmlFor="new-password">
          <PasswordInput
            id="new-password"
            placeholder={t("placeholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
        </Field>
        <Button type="submit" block arrow disabled={busy}>
          {busy ? t("updating") : t("update")}
        </Button>
      </form>

      {status ? (
        <Alert tone="info" className="lp-mt">
          {status}
        </Alert>
      ) : null}

      <div className="lp-auth-switch">
        <Link href="/login">{t("backToLogin")}</Link>
        <Link href="/">{t("backToSite")}</Link>
      </div>
    </Card>
  );
}
