"use client";

import { Save } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { useTranslations } from "next-intl";
import { updatePlatformBillingSettingsAction } from "@/app/actions/billing";

function looksLikeTestValue(value: string) {
  return /test/i.test(value);
}

function getBillingSettingsMessage(t: (key: string) => string, code?: string) {
  switch (code) {
    case "billing-saved":
      return { tone: "success", copy: t("billingSettingsSaved") };
    case "billing-missing-required":
      return { tone: "error", copy: t("billingSettingsMissingRequired") };
    case "billing-save-failed":
      return { tone: "error", copy: t("billingSettingsSaveFailed") };
    default:
      return null;
  }
}

export function AdminBillingSettingsForm({
  locale,
  values,
  statusCode
}: {
  locale: string;
  values: {
    sellerLegalName: string;
    sellerVatNumber: string;
    sellerBillingAddress: string;
    sellerEmail: string;
    paymentIban: string;
    paymentBic: string;
    paymentBankName: string;
    paymentReferencePrefix: string;
    paymentTerms: string;
    paymentTermsDays: string;
    vatRatePercent: string;
  };
  statusCode?: string;
}) {
  const t = useTranslations("adminPages");
  const message = getBillingSettingsMessage(t, statusCode);

  return (
    <Panel className="lp-billing">
      <div className="lp-panel-head">
        <div>
          <h2>{t("billingSettingsTitle")}</h2>
          <p>{t("billingSettingsCopy")}</p>
        </div>
      </div>

      {message ? <Alert tone={message.tone === "success" ? "success" : "error"}>{message.copy}</Alert> : null}

      <form action={updatePlatformBillingSettingsAction} className="lp-form-stack">
        <input type="hidden" name="locale" value={locale} />

        <label className="lp-field">
          <span className="lp-label">{t("billingSellerNameLabel")}</span>
          <input className="lp-input" name="sellerLegalName" defaultValue={values.sellerLegalName} required />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingSellerVatLabel")}</span>
          <input className="lp-input" name="sellerVatNumber" defaultValue={values.sellerVatNumber} />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingSellerAddressLabel")}</span>
          <textarea className="lp-input" name="sellerBillingAddress" rows={3} defaultValue={values.sellerBillingAddress} required />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingSellerEmailLabel")}</span>
          <input className="lp-input" type="email" name="sellerEmail" defaultValue={values.sellerEmail} required />
        </label>

        <label className="lp-field">
          <span className="lp-label">
            {t("billingPaymentIbanLabel")}
            {looksLikeTestValue(values.paymentIban) ? <Pill tone="gold">{t("billingDemoDataTag")}</Pill> : null}
          </span>
          <input className="lp-input" name="paymentIban" defaultValue={values.paymentIban} required />
        </label>

        <label className="lp-field">
          <span className="lp-label">
            {t("billingPaymentBicLabel")}
            {looksLikeTestValue(values.paymentBic) ? <Pill tone="gold">{t("billingDemoDataTag")}</Pill> : null}
          </span>
          <input className="lp-input" name="paymentBic" defaultValue={values.paymentBic} />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingPaymentBankLabel")}</span>
          <input className="lp-input" name="paymentBankName" defaultValue={values.paymentBankName} />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingPaymentReferencePrefixLabel")}</span>
          <input className="lp-input" name="paymentReferencePrefix" defaultValue={values.paymentReferencePrefix} />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingPaymentTermsDaysLabel")}</span>
          <input className="lp-input" type="number" min={1} name="paymentTermsDays" defaultValue={values.paymentTermsDays} />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingVatRateLabel")}</span>
          <input className="lp-input" name="vatRatePercent" defaultValue={values.vatRatePercent} />
        </label>

        <label className="lp-field">
          <span className="lp-label">{t("billingPaymentTermsLabel")}</span>
          <textarea className="lp-input" name="paymentTerms" rows={2} defaultValue={values.paymentTerms} />
        </label>

        <div className="lp-form-actions">
          <button className={buttonClass({ variant: "primary" })} type="submit">
            <Save size={16} />
            {t("billingSettingsSave")}
          </button>
        </div>
      </form>
    </Panel>
  );
}
