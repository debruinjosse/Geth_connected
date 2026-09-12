"use client";

import { RotateCcw, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { resetAiMasterPromptSettingsAction, updateAiMasterPromptSettingsAction } from "@/app/actions/aiSettings";

function getAiPromptSettingsMessage(t: (key: string) => string, code?: string) {
  switch (code) {
    case "ai-prompt-saved":
      return { tone: "success", copy: t("aiPromptSettingsSaved") };
    case "ai-prompt-reset":
      return { tone: "success", copy: t("aiPromptSettingsReset") };
    case "ai-prompt-too-long":
      return { tone: "error", copy: t("aiPromptSettingsTooLong") };
    case "ai-prompt-save-failed":
      return { tone: "error", copy: t("aiPromptSettingsSaveFailed") };
    default:
      return null;
  }
}

export function AiMasterPromptSettingsForm({
  locale,
  toneGuidance,
  isDefault,
  updatedByLabel,
  updatedAt,
  statusCode
}: {
  locale: string;
  toneGuidance: string;
  isDefault: boolean;
  updatedByLabel: string | null;
  updatedAt: string | null;
  statusCode?: string;
}) {
  const t = useTranslations("adminPages");
  const message = getAiPromptSettingsMessage(t, statusCode);

  return (
    <article className="panel dashboard-panel">
      <div className="panel-top">
        <div>
          <h2>{t("aiPromptSettingsTitle")}</h2>
          <p className="section-copy">{t("aiPromptSettingsCopy")}</p>
        </div>
      </div>

      {message ? <p className={`settings-feedback ${message.tone}`}>{message.copy}</p> : null}

      <form action={updateAiMasterPromptSettingsAction} className="form-grid">
        <input type="hidden" name="locale" value={locale} />

        <label className="full-span">
          <span>{t("aiPromptTextareaLabel")}</span>
          <textarea className="input" name="toneGuidance" rows={10} maxLength={4000} defaultValue={toneGuidance} />
        </label>

        {isDefault ? <p className="section-copy full-span">{t("aiPromptUsingDefaultHint")}</p> : null}

        {updatedByLabel && updatedAt ? (
          <p className="section-copy full-span">
            {t("aiPromptLastUpdatedBy", { name: updatedByLabel, date: new Date(updatedAt).toLocaleString(locale) })}
          </p>
        ) : null}

        <div className="button-row full-span">
          <button className="btn btn-primary" type="submit">
            <Save size={16} />
            {t("aiPromptSaveButton")}
          </button>
          <button className="btn btn-secondary" type="submit" formAction={resetAiMasterPromptSettingsAction}>
            <RotateCcw size={16} />
            {t("aiPromptResetButton")}
          </button>
        </div>
      </form>
    </article>
  );
}
