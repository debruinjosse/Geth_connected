import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { SupportContactForm } from "@/components/SupportContactForm";

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "resourcesPage" });

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">{t("eyebrow")}</div>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-copy">{t("copy")}</p>
        </div>
        <div className="support-page-grid">
          <article className="audience-card support-whatsapp-card">
            <BrandLogo href={`/${locale}`} dark />
            <div className="eyebrow">{t("supportTitle")}</div>
            <h3>{t("supportCardTitle")}</h3>
            <p>{t("supportCopy")}</p>
          </article>
          <SupportContactForm
            labels={{
              eyebrow: t("formEyebrow"),
              title: t("formTitle"),
              copy: t("formCopy"),
              name: t("nameLabel"),
              email: t("emailLabel"),
              company: t("companyLabel"),
              requestType: t("requestTypeLabel"),
              message: t("messageLabel"),
              emailAction: t("emailAction"),
              sending: t("sending"),
              replyTime: t("replyTime"),
              successTitle: t("successTitle"),
              successCopy: t("successCopy"),
              sendAnother: t("sendAnother"),
              whatsappAction: t("whatsappAction"),
              required: t("required"),
              errors: {
                name: t("errors.name"),
                email: t("errors.email"),
                message: t("errors.message"),
                messageLength: t("errors.messageLength")
              },
              requestTypes: [
                t("requestTypes.account"),
                t("requestTypes.claiming"),
                t("requestTypes.qr"),
                t("requestTypes.dashboard"),
                t("requestTypes.team"),
                t("requestTypes.technical"),
                t("requestTypes.other")
              ]
            }}
          />
        </div>
      </section>
    </PublicSiteChrome>
  );
}
