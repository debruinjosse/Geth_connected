"use client";

import { RotateCcw, Save } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
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
  insightType,
  title,
  copy,
  toneGuidance,
  isDefault,
  updatedByLabel,
  updatedAt,
  statusCode
}: {
  locale: string;
  insightType: "growth_timeline" | "hidden_patterns" | "master_prompt";
  title: string;
  copy: string;
  toneGuidance: string;
  isDefault: boolean;
  updatedByLabel: string | null;
  updatedAt: string | null;
  statusCode?: string;
}) {
  const t = useTranslations("adminPages");
  const message = getAiPromptSettingsMessage(t, statusCode);

  return (
    <Panel>
      <div className="lp-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
      </div>


      <form action={updateAiMasterPromptSettingsAction} className="lp-form-stack">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="insightType" value={insightType} />
        {message ? <Alert tone={message.tone === "success" ? "success" : "error"}>{message.copy}</Alert> : null}

        <label className="lp-field">
          <span className="lp-label">{t("aiPromptTextareaLabel")}</span>
          <textarea className="lp-input" name="toneGuidance" rows={10} maxLength={4000} defaultValue={toneGuidance} />
        </label>

        {isDefault ? <p className="lp-hint">{t("aiPromptUsingDefaultHint")}</p> : null}

        {updatedByLabel && updatedAt ? (
          <p className="lp-hint">
            {t("aiPromptLastUpdatedBy", { name: updatedByLabel, date: new Date(updatedAt).toLocaleString(locale) })}
          </p>
        ) : null}

        <div className="lp-form-actions">
          <button className={buttonClass({ variant: "primary" })} type="submit">
            <Save size={16} />
            {t("aiPromptSaveButton")}
          </button>
          <button className={buttonClass({ variant: "ghost" })} type="submit" formAction={resetAiMasterPromptSettingsAction}>
            <RotateCcw size={16} />
            {t("aiPromptResetButton")}
          </button>
        </div>
      </form>
    </Panel>
  );
}
