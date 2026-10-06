"use client";

import { KeyRound, Save, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendPasswordResetFromSettingsAction, updateOwnProfileNameAction, updateOwnProfilePhotoAction } from "@/app/actions/accountSettings";
import { ProfilePhotoUploadField } from "@/components/ProfilePhotoUploadField";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input } from "@/components/ui/Fields";
import { Panel } from "@/components/ui/Panel";

function getSettingsMessage(t: (key: string) => string, code?: string) {
  switch (code) {
    case "profile-updated":
      return { tone: "success", copy: t("profileUpdated") };
    case "profile-photo-updated":
      return { tone: "success", copy: t("profilePhotoUpdated") };
    case "reset-email-sent":
      return { tone: "success", copy: t("resetEmailSent") };
    case "first-name-required":
      return { tone: "error", copy: t("firstNameRequired") };
    case "profile-photo-required":
      return { tone: "error", copy: t("profilePhotoRequired") };
    case "profile-photo-invalid":
      return { tone: "error", copy: t("profilePhotoInvalid") };
    case "profile-photo-too-large":
      return { tone: "error", copy: t("profilePhotoTooLarge") };
    case "profile-photo-failed":
      return { tone: "error", copy: t("profilePhotoFailed") };
    case "profile-update-failed":
      return { tone: "error", copy: t("profileUpdateFailed") };
    case "reset-email-failed":
      return { tone: "error", copy: t("resetEmailFailed") };
    default:
      return null;
  }
}

export function AccountSettingsPanel({
  email,
  firstName,
  lastName,
  profileImageUrl,
  returnTo,
  statusCode
}: {
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  returnTo: string;
  statusCode?: string;
}) {
  const t = useTranslations("accountSettings");
  const message = getSettingsMessage(t, statusCode);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GU";

  return (
    <Panel title={t("title")} description={t("subtitle")} className="lp-settings">
      {message ? (
        <div className="lp-mb">
          <Alert tone={message.tone === "success" ? "success" : "error"}>{message.copy}</Alert>
        </div>
      ) : null}

      <form action={updateOwnProfilePhotoAction} className="lp-settings-block">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="lp-profile-head" style={{ marginBottom: 18 }}>
          <Avatar size="xl" name={`${firstName} ${lastName}`} initials={initials} imageUrl={profileImageUrl} />
          <div>
            <b style={{ fontWeight: 500 }}>{t("profilePhoto")}</b>
            <p className="lp-hint" style={{ fontSize: 14.5, marginTop: 4 }}>{t("profilePhotoCopy")}</p>
          </div>
        </div>
        <ProfilePhotoUploadField />
        <div style={{ marginTop: 16 }}>
          <Button type="submit" variant="ghost" size="sm" icon={<UploadCloud />}>
            {t("uploadPhoto")}
          </Button>
        </div>
      </form>

      <form action={updateOwnProfileNameAction} className="lp-settings-block">
        <input type="hidden" name="returnTo" value={returnTo} />
        <FieldGrid>
          <Field label={t("firstName")} htmlFor="settings-first-name">
            <Input id="settings-first-name" name="firstName" defaultValue={firstName} required />
          </Field>
          <Field label={t("lastName")} htmlFor="settings-last-name">
            <Input id="settings-last-name" name="lastName" defaultValue={lastName} required />
          </Field>
        </FieldGrid>
        <div style={{ marginTop: 18 }}>
          <Button type="submit" size="sm" icon={<Save />}>
            {t("saveName")}
          </Button>
        </div>
      </form>

      <form action={sendPasswordResetFromSettingsAction} className="lp-settings-block">
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="email" value={email} />
        <b style={{ fontWeight: 500 }}>{t("passwordReset")}</b>
        <p className="lp-hint" style={{ fontSize: 14.5, margin: "4px 0 16px" }}>{t("passwordResetCopy")}</p>
        <Button type="submit" variant="ghost" size="sm" icon={<KeyRound />}>
          {t("sendResetEmail")}
        </Button>
      </form>
    </Panel>
  );
}
