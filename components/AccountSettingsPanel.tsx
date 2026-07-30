"use client";

import Image from "next/image";
import { KeyRound, Save, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { sendPasswordResetFromSettingsAction, updateOwnProfileNameAction, updateOwnProfilePhotoAction } from "@/app/actions/accountSettings";
import { ProfilePhotoUploadField } from "@/components/ProfilePhotoUploadField";

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
    <article className="panel dashboard-panel account-settings-panel">
      <div className="panel-top">
        <div>
          <h2>{t("title")}</h2>
          <p>{t("subtitle")}</p>
        </div>
      </div>

      {message ? <p className={`settings-feedback ${message.tone}`}>{message.copy}</p> : null}

      <form action={updateOwnProfilePhotoAction} className="settings-photo-form">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="settings-photo-preview">
          <div className="profile-photo-large">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt={t("profilePhotoAlt", { name: firstName || "Your" })} width={82} height={82} unoptimized />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <strong>{t("profilePhoto")}</strong>
            <p>{t("profilePhotoCopy")}</p>
          </div>
        </div>
        <ProfilePhotoUploadField />
        <div className="settings-action-row">
          <button className="btn btn-secondary" type="submit">
            <UploadCloud size={16} /> {t("uploadPhoto")}
          </button>
        </div>
      </form>

      <form action={updateOwnProfileNameAction} className="settings-name-form">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="settings-field-grid">
          <label>
            {t("firstName")}
            <input name="firstName" value={firstName} required />
          </label>
          <label>
            {t("lastName")}
            <input name="lastName" value={lastName} required />
          </label>
        </div>
        <div className="settings-action-row">
          <button className="btn btn-dark" type="submit">
            <Save size={16} /> {t("saveName")}
          </button>
        </div>
      </form>

      <form action={sendPasswordResetFromSettingsAction} className="settings-reset-form">
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="email" value={email} />
        <div>
          <strong>{t("passwordReset")}</strong>
          <p>{t("passwordResetCopy")}</p>
        </div>
        <div className="settings-action-row">
          <button className="btn btn-secondary" type="submit">
            <KeyRound size={16} /> {t("sendResetEmail")}
          </button>
        </div>
      </form>
    </article>
  );
}
