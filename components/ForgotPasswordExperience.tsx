"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { setPasswordDirectAction } from "@/app/actions/forgotPassword";

export function ForgotPasswordExperience() {
  const locale = useLocale();
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const result = await setPasswordDirectAction({ email, password, confirmPassword });
      if (!result.ok) {
        throw new Error(result.error);
      }

      setStatusTone("success");
      setStatus(t("success"));
      window.setTimeout(() => {
        window.location.assign(`/${locale}/login?error=password_updated`);
      }, 1200);
    } catch (error) {
      setStatusTone("error");
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
        <div className="form-field">
          <label htmlFor="forgot-password">{t("newPassword")}</label>
          <div className="password-input-wrap">
            <input
              id="forgot-password"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="forgot-confirm-password">{t("confirmPassword")}</label>
          <div className="password-input-wrap">
            <input
              id="forgot-confirm-password"
              className="input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("confirmPlaceholder")}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
            >
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button className="btn btn-dark btn-full" disabled={busy} type="submit">
          {busy ? t("updating") : t("update")} <ArrowRight size={16} />
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
