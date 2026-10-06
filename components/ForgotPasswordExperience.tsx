"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { requestPasswordResetEmail } from "@/app/actions/passwordReset";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Fields";

export function ForgotPasswordExperience() {
  const locale = useLocale();
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const result = await requestPasswordResetEmail(email);
      if (!result.ok) {
        throw new Error(result.error);
      }

      setStatusTone("success");
      setStatus(t("success"));
    } catch (error) {
      setStatusTone("error");
      setStatus(error instanceof Error ? error.message : t("errSend"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card size="lg" className="lp-auth-card">
      <h2>{t("title")}</h2>
      <p className="lp-sub">{t("copy")}</p>

      <form className="lp-form" onSubmit={handleSubmit}>
        <Field label={t("workEmail")} htmlFor="forgot-email">
          <Input
            id="forgot-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </Field>
        <Button type="submit" block arrow disabled={busy}>
          {busy ? t("sending") : t("sendLink")}
        </Button>
      </form>

      {status ? (
        <Alert tone={statusTone} className="lp-mt">
          {status}
        </Alert>
      ) : null}

      <div className="lp-auth-switch">
        <Link href={`/${locale}/login`}>{t("backToLogin")}</Link>
        <Link href={`/${locale}`}>{t("backToSite")}</Link>
      </div>
    </Card>
  );
}
