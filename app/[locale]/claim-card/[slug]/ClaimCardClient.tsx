"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Search } from "lucide-react";
import { claimRecognition, giveRecognition } from "@/app/actions/claimRecognition";
import { CardArtwork } from "@/components/CardArtwork";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Fields";
import { Pill } from "@/components/ui/Pill";
import { getLocalizedCategoryDisplayName, getLocalizedGethCard, type GethCard } from "@/lib/cards";
import { people } from "@/lib/demo-data";
import { hasSupabaseBrowserConfig, saveStoredRecognition } from "@/lib/demo-session";

const claimStageKeys = ["stageCard", "stageGiver", "stageNote", "stageConfirm"] as const;
const giveStageKeys = ["stageCard", "stageReceiver", "stageNote", "stageConfirm"] as const;
const transitionEase = [0.22, 1, 0.36, 1] as const;

type ClaimGiverOption = {
  id: string;
  name: string;
  initials: string;
  team: string;
  email?: string;
  imageUrl?: string | null;
};

function ProfileAvatar({ person }: { person: Pick<ClaimGiverOption, "name" | "initials" | "imageUrl"> }) {
  return <Avatar name={person.name} initials={person.initials} imageUrl={person.imageUrl} />;
}

export function ClaimCardClient({
  card,
  requestedSlug,
  giverOptions,
  companyName,
  receiverName,
  locale,
  initialFlowMode = "claim"
}: {
  card: GethCard | null;
  requestedSlug: string;
  giverOptions?: ClaimGiverOption[];
  companyName?: string | null;
  receiverName?: string;
  locale: string;
  initialFlowMode?: "give" | "claim";
}) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const t = useTranslations("claimCard");
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const flowMode = initialFlowMode === "give" || searchParams.get("mode") === "give" ? "give" : "claim";
  const stages = flowMode === "give" ? giveStageKeys : claimStageKeys;
  const claimOrigin =
    source === "qr_scan" ? "qr_scan" : source === "manual_entry" ? "manual_entry" : flowMode === "give" ? "card_library" : "direct_link";
  const giveClaimOrigin =
    source === "manual_entry" ? "manual_entry" : source === "qr_scan" ? "direct_link" : "card_library";
  const localePrefix = `/${locale}`;
  const [selectedGiver, setSelectedGiver] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const availablePeople = giverOptions?.length ? giverOptions : hasSupabaseBrowserConfig() ? [] : people;
  const resolvedReceiverName = receiverName ?? "Sarah van den Berg";
  const displayCard = card ? getLocalizedGethCard(card, locale) : null;

  if (!card) {
    return (
      <div className="lp-claim-empty">
        <Card size="lg" className="lp-claim-notfound">
          <span className="lp-eyebrow">{t("cardNotFound")}</span>
          <h1>We couldn&apos;t find &ldquo;{requestedSlug}&rdquo;.</h1>
          <p className="lp-lead">The QR route may be inactive, renamed, or not part of this deck.</p>
          <div className="lp-cta-row" style={{ justifyContent: "center", marginTop: 28 }}>
            <Button href={`${localePrefix}/cards`}>Open card library</Button>
            <Button href={localePrefix} variant="ghost">
              Back home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const filteredPeople = availablePeople.filter((person) => {
    const haystack = `${person.name} ${person.team}`.toLowerCase();
    return haystack.includes(deferredQuery.trim().toLowerCase());
  });
  const selectedPerson = availablePeople.find((person) => person.id === selectedGiver);

  function selectTeammate(teammateId: string) {
    setSelectedGiver(teammateId);
  }

  function submit() {
    if (!selectedGiver || !card) return;

    startTransition(async () => {
      setSubmitError("");
      const result =
        flowMode === "give"
          ? await giveRecognition({
              cardSlug: card.slug,
              receiverUserId: selectedGiver,
              personalNote: note,
              claimOrigin: giveClaimOrigin
            })
          : await claimRecognition({
              cardSlug: card.slug,
              giverUserId: selectedGiver,
              personalNote: note,
              claimOrigin
            });

      if (!result.ok) {
        setSubmitError(result.error);
        if (result.code === "AUTH_REQUIRED") {
          const nextUrl =
            flowMode === "give"
              ? `${localePrefix}/give-card/${requestedSlug}`
              : `${localePrefix}/claim-card/${requestedSlug}${claimOrigin === "qr_scan" ? "?source=qr_scan" : ""}`;
          router.push(`${localePrefix}/login?next=${encodeURIComponent(nextUrl)}`);
        }
        return;
      }

      if (!hasSupabaseBrowserConfig()) {
        saveStoredRecognition({
          id: `stored-${Date.now()}`,
          cardSlug: card.slug,
          cardTitle: displayCard?.title ?? card.title,
          category: displayCard?.category ?? card.category,
          giverId: flowMode === "give" ? "demo-giver-self" : selectedGiver,
          giverName: flowMode === "give" ? resolvedReceiverName : selectedPerson?.name ?? t("unknownGiver"),
          receiverName: flowMode === "give" ? selectedPerson?.name ?? t("aTeammate") : resolvedReceiverName,
          note,
          createdAt: new Date().toISOString()
        });
      }

      setDone(true);
    });
  }

  const cardTitle = displayCard?.title ?? card.title;
  const cardCategory = getLocalizedCategoryDisplayName(card.category, locale);

  return (
    <section className="lp-claim-grid">
      <div className="lp-claim-card-col">
        <div className="lp-claim-stage">
          <CardArtwork cardNumber={card.cardNumber} locale={locale} title={cardTitle} priority sizes="(max-width: 1020px) 60vw, 360px" className="lp-claim-art" />
          <div className="lp-claim-caption">
            <b>{cardTitle}</b>
            <Pill tone="gold">{cardCategory}</Pill>
          </div>
        </div>
      </div>

      <div className="lp-claim-right">
        <Card size="lg" className="lp-claim-form">
          {done ? (
            <div className="lp-claim-success">
              <span className="lp-icontile lp-icontile-lg" aria-hidden="true">
                <Check />
              </span>
              <h2>{flowMode === "give" ? t("sentTitle") : t("claimedTitle")}</h2>
              <p>{flowMode === "give" ? t("sentCopy", { name: selectedPerson?.name ?? t("yourTeammate") }) : t("claimedCopy")}</p>
              <div className="lp-cta-row" style={{ justifyContent: "center", marginTop: 8 }}>
                <Button href={`${localePrefix}/dashboard`} arrow>
                  {t("openDashboard")}
                </Button>
                <Button href={`${localePrefix}/cards${flowMode === "give" ? "?intent=give" : ""}`} variant="ghost">
                  {flowMode === "give" ? t("giveAnother") : t("claimAnother")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ol className="lp-stepper" aria-label={t(stages[step - 1])}>
                {stages.map((stage, index) => {
                  const stageNumber = index + 1;
                  const state = stageNumber === step ? "lp-now" : stageNumber < step ? "lp-done" : "";
                  return (
                    <li className={state} key={stage} aria-current={stageNumber === step ? "step" : undefined}>
                      <span>{stageNumber < step ? <Check aria-hidden="true" /> : stageNumber}</span>
                      <small>{t(stage)}</small>
                    </li>
                  );
                })}
              </ol>

              <AnimatePresence mode="wait">
                <motion.div
                  className="lp-claim-body"
                  key={step}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.28, ease: transitionEase }}
                >
                  {step === 1 ? (
                    <div className="lp-claim-step">
                      <h2>{flowMode === "give" ? t("step1GiveTitle") : t("step1ClaimTitle")}</h2>
                      {flowMode === "give" ? <p>{t("step1GiveCopy")}</p> : null}
                      <div className="lp-claim-chosen">
                        <div>
                          {flowMode === "give" ? <span className="lp-eyebrow">{t("step1GiveCardLabel")}</span> : null}
                          <b>{cardTitle}</b>
                        </div>
                        <Pill tone="gold">{cardCategory}</Pill>
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="lp-claim-step">
                      <h2>{flowMode === "give" ? t("step2GiveTitle") : t("step2ClaimTitle")}</h2>
                      <p>{flowMode === "give" ? t("step2GiveCopy") : t("step2ClaimCopy")}</p>
                      {flowMode === "give" && companyName ? <p className="lp-hint">{t("colleaguesAt", { companyName })}</p> : null}
                      <Field label={t("searchLabel")} htmlFor="giver-search">
                        <div className="lp-input-icon">
                          <Search aria-hidden="true" />
                          <Input id="giver-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchLabel")} />
                        </div>
                      </Field>
                      <div className="lp-people" role="radiogroup">
                        {filteredPeople.length ? (
                          filteredPeople.map((person) => (
                            <label className={`lp-person-option${selectedGiver === person.id ? " lp-picked" : ""}`} key={person.id}>
                              <ProfileAvatar person={person} />
                              <span className="lp-person-text">
                                <b>{person.name}</b>
                                <small>{person.team}</small>
                              </span>
                              <input type="radio" name="giver" value={person.id} checked={selectedGiver === person.id} onChange={(event) => selectTeammate(event.target.value)} />
                              <span className="lp-radio" aria-hidden="true">
                                <Check />
                              </span>
                            </label>
                          ))
                        ) : (
                          <Alert tone="info" title={t("noColleagues")}>
                            {hasSupabaseBrowserConfig()
                              ? t("noColleaguesLoggedIn", { role: flowMode === "give" ? t("roleRecipient") : t("roleGiver") })
                              : t("noColleaguesDemo", { role: flowMode === "give" ? t("roleRecipient") : t("roleGiver") })}
                          </Alert>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="lp-claim-step">
                      <h2>{flowMode === "give" && selectedPerson ? t("step3GiveTitle", { name: selectedPerson.name }) : t("step3ClaimTitle")}</h2>
                      <p>{flowMode === "give" ? t("step3GiveCopy") : t("step3ClaimCopy")}</p>
                      {selectedPerson ? (
                        <div className="lp-claim-chosen">
                          <div className="lp-person-option lp-picked" style={{ border: 0, padding: 0, background: "none", boxShadow: "none" }}>
                            <ProfileAvatar person={selectedPerson} />
                            <span className="lp-person-text">
                              <span className="lp-eyebrow">{flowMode === "give" ? t("selectedReceiver") : t("selectedGiver")}</span>
                              <b>{selectedPerson.name}</b>
                              <small>{selectedPerson.team}</small>
                            </span>
                          </div>
                        </div>
                      ) : null}
                      <Field label={t("noteLabel")} htmlFor="note" hint={t("noteCharCount", { count: note.length })}>
                        <Textarea
                          id="note"
                          maxLength={280}
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder={flowMode === "give" ? t("notePlaceholderGive") : t("notePlaceholderClaim")}
                        />
                      </Field>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="lp-claim-step">
                      <h2>{flowMode === "give" ? t("step4GiveTitle") : t("step4ClaimTitle")}</h2>
                      <p>{flowMode === "give" ? t("step4GiveCopy") : t("step4ClaimCopy")}</p>
                      <dl className="lp-summary">
                        <div>
                          <dt>{t("summaryCard")}</dt>
                          <dd>{cardTitle}</dd>
                        </div>
                        <div>
                          <dt>{t("category")}</dt>
                          <dd>{cardCategory}</dd>
                        </div>
                        <div>
                          <dt>{t("receiver")}</dt>
                          <dd>{flowMode === "give" ? selectedPerson?.name ?? t("noReceiver") : resolvedReceiverName}</dd>
                        </div>
                        <div>
                          <dt>{t("givenBy")}</dt>
                          <dd>{flowMode === "give" ? resolvedReceiverName : selectedPerson ? `${selectedPerson.name} - ${selectedPerson.team}` : t("noGiver")}</dd>
                        </div>
                        <div>
                          <dt>{t("noteLabel")}</dt>
                          <dd>{note || t("noteAdded")}</dd>
                        </div>
                        <div>
                          <dt>{t("claimSource")}</dt>
                          <dd>
                            {flowMode === "give"
                              ? giveClaimOrigin === "manual_entry"
                                ? t("sourceManual")
                                : giveClaimOrigin === "direct_link"
                                  ? t("sourceLink")
                                  : t("sourceLibrary")
                              : claimOrigin === "qr_scan"
                                ? t("sourceQr")
                                : claimOrigin === "manual_entry"
                                  ? t("sourceManual")
                                  : t("sourceLink")}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}

                  {submitError ? (
                    <div style={{ marginTop: 20 }}>
                      <Alert tone="error">{submitError}</Alert>
                    </div>
                  ) : null}

                  <div className="lp-claim-actions">
                    {step > 1 ? (
                      <Button variant="ghost" onClick={() => setStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4) : current))} icon={<ArrowLeft />}>
                        {t("back")}
                      </Button>
                    ) : (
                      <span />
                    )}
                    {step < 4 ? (
                      <Button disabled={step === 2 && !selectedGiver} onClick={() => setStep((current) => (current < 4 ? ((current + 1) as 1 | 2 | 3 | 4) : current))} arrow>
                        {t("continue")}
                      </Button>
                    ) : (
                      <Button disabled={!selectedGiver || isPending} onClick={submit} arrow>
                        {isPending ? t("saving") : flowMode === "give" ? t("sendCard") : t("claimRecognition")}
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </Card>

        {!done ? <p className="lp-hint lp-claim-support">{t("support")}</p> : null}
      </div>
    </section>
  );
}
