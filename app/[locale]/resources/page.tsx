import { Mail, MessageCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { SupportContactForm } from "@/components/SupportContactForm";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageHero } from "@/components/ui/PageHero";

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "resourcesPage" });

  return (
    <PublicSiteChrome locale={locale}>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("copy")} />
      <section className="lp-section-sm" style={{ paddingTop: 8, paddingBottom: 112 }}>
        <Container>
          <div className="lp-split">
            <Card as="article" tone="dark" size="lg" className="lp-rv">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lp-card-mark" src="/landing/badges/geth_constellation_bird_mark.svg" alt="" />
              <Eyebrow>{t("supportTitle")}</Eyebrow>
              <h2 style={{ margin: "14px 0 14px" }}>{t("supportCardTitle")}</h2>
              <p style={{ color: "#D8CBD9" }}>{t("supportCopy")}</p>
              <ul className="lp-contact-list">
                <li>
                  <Mail aria-hidden="true" />
                  <a href="mailto:info@geth.pro">info@geth.pro</a>
                </li>
                <li>
                  <MessageCircle aria-hidden="true" />
                  <span>{t("whatsappAction")}</span>
                </li>
              </ul>
            </Card>
            <div className="lp-rv">
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
          </div>
        </Container>
      </section>
    </PublicSiteChrome>
  );
}
