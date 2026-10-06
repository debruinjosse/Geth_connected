"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createDemoBookingAction, type DemoBookingState } from "@/app/actions/demoBookings";
import type { AppLocale } from "@/i18n/routing";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldGrid, Input, Select, Textarea } from "@/components/ui/Fields";

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
      <Card size="lg">
        <Alert tone="success" title={t("successTitle")}>
          {state.message}
        </Alert>
      </Card>
    );
  }

  return (
    <Card as="form" size="lg" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <div className="lp-form">
        <FieldGrid>
          <Field label={t("name")} htmlFor="demo-name">
            <Input id="demo-name" name="name" placeholder={t("namePlaceholder")} autoComplete="name" required />
          </Field>
          <Field label={t("workEmail")} htmlFor="demo-email">
            <Input id="demo-email" name="email" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" required />
          </Field>
          <Field label={t("company")} htmlFor="demo-company">
            <Input id="demo-company" name="company" placeholder={t("companyPlaceholder")} autoComplete="organization" required />
          </Field>
          <Field label={t("teamSize")} htmlFor="demo-team-size">
            <Select id="demo-team-size" name="teamSize" required>
              <option value="1-20">1-20</option>
              <option value="21-50">21-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </Select>
          </Field>
          <Field label={t("role")} htmlFor="demo-role">
            <Select id="demo-role" name="role" required>
              <option value="People & Culture">{t("rolePeopleCulture")}</option>
              <option value="Founder / Executive">{t("roleFounder")}</option>
              <option value="Manager">{t("roleManager")}</option>
              <option value="Operations">{t("roleOperations")}</option>
            </Select>
          </Field>
          <Field label={t("duration")} htmlFor="demo-duration">
            <Select id="demo-duration" name="durationMinutes" defaultValue="30" required>
              <option value="30">{t("duration30")}</option>
              <option value="45">{t("duration45")}</option>
              <option value="60">{t("duration60")}</option>
            </Select>
          </Field>
          <Field label={t("preferredDate")} htmlFor="demo-date">
            <Input id="demo-date" name="preferredDate" type="date" required />
          </Field>
          <Field label={t("preferredTime")} htmlFor="demo-time">
            <Input id="demo-time" name="preferredTime" type="time" required />
          </Field>
          <Field className="lp-span-2" label={t("timezone")} htmlFor="demo-timezone">
            <Input id="demo-timezone" name="timezone" placeholder={t("timezonePlaceholder")} defaultValue="Europe/Amsterdam" required />
          </Field>
          <Field className="lp-span-2" label={t("message")} htmlFor="demo-message">
            <Textarea id="demo-message" name="message" defaultValue={t("defaultMessage")} required />
          </Field>
        </FieldGrid>
        {state.message ? <Alert tone="error">{state.message}</Alert> : null}
        <div>
          <Button type="submit" disabled={pending} arrow>
            {pending ? t("submitting") : t("submit")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
