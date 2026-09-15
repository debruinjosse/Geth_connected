"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { requestPasswordResetEmail } from "@/app/actions/passwordReset";

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
    <div className="auth-card">
      <h2>{t("title")}</h2>
      <p className="section-copy">{t("copy")}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="forgot-email">{t("workEmail")}</label>
          <input
            id="forgot-email"
            className="input"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <button className="btn btn-dark btn-full" disabled={busy} type="submit">
          {busy ? t("sending") : t("sendLink")} <ArrowRight size={16} />
        </button>
      </form>

      {status ? (
        <p className={`auth-status auth-status-${statusTone}`}>
          <CheckCircle2 size={16} />
          {status}
        </p>
      ) : null}

      <div className="auth-links">
        <Link href={`/${locale}/login`}>{t("backToLogin")}</Link>
        <Link href={`/${locale}`}>{t("backToSite")}</Link>
      </div>
    </div>
  );
}
