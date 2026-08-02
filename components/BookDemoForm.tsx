"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createDemoBookingAction, type DemoBookingState } from "@/app/actions/demoBookings";
import type { AppLocale } from "@/i18n/routing";

const initialState: DemoBookingState = {
  ok: false,
  message: ""
};

export function BookDemoForm() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("bookDemoPage");
  const [state, formAction, pending] = useActionState(createDemoBookingAction, initialState);

  if (state.ok) {
    return (
      <div className="panel form-success-panel">
        <CheckCircle2 size={54} color="var(--theme-emerald)" />
        <h2>{t("successTitle")}</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form className="panel demo-form-panel" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="demo-name">{t("name")}</label>
          <input id="demo-name" name="name" className="input" placeholder={t("namePlaceholder")} autoComplete="name" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-email">{t("workEmail")}</label>
          <input id="demo-email" name="email" className="input" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-company">{t("company")}</label>
          <input id="demo-company" name="company" className="input" placeholder={t("companyPlaceholder")} autoComplete="organization" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-team-size">{t("teamSize")}</label>
          <select id="demo-team-size" name="teamSize" className="input" required>
            <option value="1-20">1-20</option>
            <option value="21-50">21-50</option>
            <option value="51-200">51-200</option>
            <option value="200+">200+</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="demo-role">{t("role")}</label>
          <select id="demo-role" name="role" className="input" required>
            <option value="People & Culture">{t("rolePeopleCulture")}</option>
            <option value="Founder / Executive">{t("roleFounder")}</option>
            <option value="Manager">{t("roleManager")}</option>
            <option value="Operations">{t("roleOperations")}</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="demo-date">{t("preferredDate")}</label>
          <input id="demo-date" name="preferredDate" className="input" type="date" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-time">{t("preferredTime")}</label>
          <input id="demo-time" name="preferredTime" className="input" type="time" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-timezone">{t("timezone")}</label>
          <input id="demo-timezone" name="timezone" className="input" placeholder={t("timezonePlaceholder")} defaultValue="Europe/Amsterdam" required />
        </div>
        <div className="form-field">
          <label htmlFor="demo-duration">{t("duration")}</label>
          <select id="demo-duration" name="durationMinutes" className="input" defaultValue="30" required>
            <option value="30">{t("duration30")}</option>
            <option value="45">{t("duration45")}</option>
            <option value="60">{t("duration60")}</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="demo-message">{t("message")}</label>
        <textarea id="demo-message" name="message" className="input" defaultValue={t("defaultMessage")} required />
      </div>
      {state.message ? <p className="auth-status auth-status-error">{state.message}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")} <ArrowRight size={16} />
      </button>
    </form>
  );
}
