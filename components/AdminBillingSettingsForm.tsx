"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { updatePlatformBillingSettingsAction } from "@/app/actions/billing";

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
    <article className="panel dashboard-panel">
      <div className="panel-top">
        <div>
          <h2>{t("billingSettingsTitle")}</h2>
          <p className="section-copy">{t("billingSettingsCopy")}</p>
        </div>
      </div>

      {message ? <p className={`settings-feedback ${message.tone}`}>{message.copy}</p> : null}

      <form action={updatePlatformBillingSettingsAction} className="form-grid admin-billing-settings-form">
        <input type="hidden" name="locale" value={locale} />

        <label>
          <span>{t("billingSellerNameLabel")}</span>
          <input className="input" name="sellerLegalName" defaultValue={values.sellerLegalName} required />
        </label>

        <label>
          <span>{t("billingSellerVatLabel")}</span>
          <input className="input" name="sellerVatNumber" defaultValue={values.sellerVatNumber} />
        </label>

        <label className="full-span">
          <span>{t("billingSellerAddressLabel")}</span>
          <textarea className="input" name="sellerBillingAddress" rows={3} defaultValue={values.sellerBillingAddress} required />
        </label>

        <label>
          <span>{t("billingSellerEmailLabel")}</span>
          <input className="input" type="email" name="sellerEmail" defaultValue={values.sellerEmail} required />
        </label>

        <label>
          <span>{t("billingPaymentIbanLabel")}</span>
          <input className="input" name="paymentIban" defaultValue={values.paymentIban} required />
        </label>

        <label>
          <span>{t("billingPaymentBicLabel")}</span>
          <input className="input" name="paymentBic" defaultValue={values.paymentBic} />
        </label>

        <label>
          <span>{t("billingPaymentBankLabel")}</span>
          <input className="input" name="paymentBankName" defaultValue={values.paymentBankName} />
        </label>

        <label>
          <span>{t("billingPaymentReferencePrefixLabel")}</span>
          <input className="input" name="paymentReferencePrefix" defaultValue={values.paymentReferencePrefix} />
        </label>

        <label>
          <span>{t("billingPaymentTermsDaysLabel")}</span>
          <input className="input" type="number" min={1} name="paymentTermsDays" defaultValue={values.paymentTermsDays} />
        </label>

        <label>
          <span>{t("billingVatRateLabel")}</span>
          <input className="input" name="vatRatePercent" defaultValue={values.vatRatePercent} />
        </label>

        <label className="full-span">
          <span>{t("billingPaymentTermsLabel")}</span>
          <textarea className="input" name="paymentTerms" rows={2} defaultValue={values.paymentTerms} />
        </label>

        <div className="button-row full-span">
          <button className="btn btn-primary" type="submit">
            <Save size={16} />
            {t("billingSettingsSave")}
          </button>
        </div>
      </form>
    </article>
  );
}
