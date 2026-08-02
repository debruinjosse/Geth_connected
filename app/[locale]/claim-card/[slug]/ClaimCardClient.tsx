"use client";

import Link from "next/link";
import Image from "next/image";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Search } from "lucide-react";
import { claimRecognition, giveRecognition } from "@/app/actions/claimRecognition";
import { GethCardVisual } from "@/components/GethCardVisual";
import { getLocalizedGethCard, type GethCard } from "@/lib/cards";
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
  return (
    <div className="avatar">
      {person.imageUrl ? <Image src={person.imageUrl} alt={`${person.name} profile`} width={48} height={48} unoptimized /> : person.initials}
    </div>
  );
}

export function ClaimCardClient({
  card,
  requestedSlug,
  giverOptions,
  receiverName,
  locale,
  initialFlowMode = "claim"
}: {
  card: GethCard | null;
  requestedSlug: string;
  giverOptions?: ClaimGiverOption[];
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
      <div className="claim-empty">
        <section className="panel claim-empty-card">
          <div className="eyebrow">{t("cardNotFound")}</div>
          <h1 className="claim-empty-title">We couldn&apos;t find &ldquo;{requestedSlug}&rdquo;.</h1>
          <p className="section-copy">The QR route may be inactive, renamed, or not part of this deck.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
            <Link className="btn btn-dark" href={`${localePrefix}/cards`}>
              Open card library
            </Link>
            <Link className="btn btn-secondary" href={localePrefix}>
              Back home
            </Link>
          </div>
        </section>
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
              giverUserId: selectedGiver || undefined,
              giverName: selectedPerson?.name,
              giverEmail: selectedPerson?.email,
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

  return (
    <section className="claim-shell">
      <div>
        <div className="claim-progress">
          {stages.map((stage, index) => {
            const stageNumber = index + 1;
            const active = stageNumber === step;
            const complete = stageNumber < step;
            return (
              <div className={`claim-progress-step ${active ? "active" : ""} ${complete ? "complete" : ""}`.trim()} key={stage}>
                <span>{complete ? "✓" : stageNumber}</span>
                <strong>{t(stage)}</strong>
              </div>
            );
          })}
        </div>

        <GethCardVisual card={displayCard ?? card} variant="claim" locale={locale} />
      </div>

      <div className="claim-right">
        <section className="claim-form">
          {done ? (
            <div className="claim-success-state">
              <CheckCircle2 size={70} color="var(--theme-emerald)" />
              <h2>{flowMode === "give" ? t("sentTitle") : t("claimedTitle")}</h2>
              <p>
                {flowMode === "give"
                  ? t("sentCopy", { name: selectedPerson?.name ?? t("yourTeammate") })
                  : t("claimedCopy")}
              </p>
              <div className="claim-success-actions">
                <Link className="btn btn-dark" href={`${localePrefix}/dashboard`}>
                  {t("openDashboard")}
                </Link>
                <Link
                  className="btn btn-secondary"
                  href={`${localePrefix}/cards${flowMode === "give" ? "?intent=give" : ""}`}
                >
                  {flowMode === "give" ? t("giveAnother") : t("claimAnother")}
                </Link>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: transitionEase }}
              >
                {step === 1 ? (
                  <>
                    <h2>{flowMode === "give" ? t("step1GiveTitle") : t("step1ClaimTitle")}</h2>
                    {flowMode === "give" ? <p>{t("step1GiveCopy")}</p> : null}
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <h2>{flowMode === "give" ? t("step2GiveTitle") : t("step2ClaimTitle")}</h2>
                    <p>
                      {flowMode === "give"
                        ? t("step2GiveCopy")
                        : t("step2ClaimCopy")}
                    </p>
                    <div className="form-field">
                      <label htmlFor="giver-search">{t("searchLabel")}</label>
                      <div className="input-wrap">
                        <Search size={18} style={{ position: "absolute", left: 16, top: 18, color: "var(--theme-muted)" }} />
                        <input
                          id="giver-search"
                          className="input"
                          style={{ paddingLeft: 46 }}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={t("searchLabel")}
                        />
                      </div>
                    </div>
                    <div className="signal-list">
                      {filteredPeople.length ? (
                        filteredPeople.map((person) => (
                          <label className="person-option" key={person.id}>
                            <div className="person-details">
                              <ProfileAvatar person={person} />
                              <div>
                                <strong>{person.name}</strong>
                                <p style={{ margin: "4px 0 0" }}>{person.team}</p>
                              </div>
                            </div>
                            <input type="radio" name="giver" value={person.id} checked={selectedGiver === person.id} onChange={(event) => selectTeammate(event.target.value)} />
                          </label>
                        ))
                      ) : (
                        <div className="person-option" aria-live="polite">
                          <div className="person-details">
                            <div>
                              <strong>{t("noColleagues")}</strong>
                              <p style={{ margin: "4px 0 0" }}>
                                {hasSupabaseBrowserConfig()
                                  ? t("noColleaguesLoggedIn", { role: flowMode === "give" ? t("roleRecipient") : t("roleGiver") })
                                  : t("noColleaguesDemo", { role: flowMode === "give" ? t("roleRecipient") : t("roleGiver") })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <h2>{flowMode === "give" && selectedPerson ? t("step3GiveTitle", { name: selectedPerson.name }) : t("step3ClaimTitle")}</h2>
                    <p>
                      {flowMode === "give"
                        ? t("step3GiveCopy")
                        : t("step3ClaimCopy")}
                    </p>
                    {selectedPerson ? (
                      <div className="selected-giver-card">
                        <span className="approval-eyebrow">
                          {flowMode === "give" ? t("selectedReceiver") : t("selectedGiver")}
                        </span>
                        <div className="person-details">
                          <ProfileAvatar person={selectedPerson} />
                          <div>
                            <strong>{selectedPerson.name}</strong>
                            <p>{selectedPerson.team}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="form-field">
                      <label htmlFor="note">{t("noteLabel")}</label>
                      <textarea
                        id="note"
                        className="input"
                        maxLength={280}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={
                          flowMode === "give"
                            ? t("notePlaceholderGive")
                            : t("notePlaceholderClaim")
                        }
                      />
                      <span className="field-help">{t("noteCharCount", { count: note.length })}</span>
                    </div>
                  </>
                ) : null}

                {step === 4 ? (
                  <>
                    <h2>{flowMode === "give" ? t("step4GiveTitle") : t("step4ClaimTitle")}</h2>
                    <p className="claim-step-copy">
                      {flowMode === "give"
                        ? t("step4GiveCopy")
                        : t("step4ClaimCopy")}
                    </p>
                    <div className="claim-summary">
                      <div className="claim-summary-row">
                        <strong>{t("summaryCard")}</strong>
                        <p>{displayCard?.title ?? card.title}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>{t("category")}</strong>
                        <p>{displayCard?.category ?? card.category}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>{t("receiver")}</strong>
                        <p>{flowMode === "give" ? selectedPerson?.name ?? t("noReceiver") : resolvedReceiverName}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>{t("givenBy")}</strong>
                        <p>{flowMode === "give" ? resolvedReceiverName : selectedPerson ? `${selectedPerson.name} - ${selectedPerson.team}` : t("noGiver")}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>{t("noteLabel")}</strong>
                        <p>{note || t("noteAdded")}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>{t("claimSource")}</strong>
                        <p>
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
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}

                {submitError ? (
                  <p className="claim-error" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <div className="claim-actions">
                  {step > 1 ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4) : current))}
                    >
                      <ArrowLeft size={16} /> {t("back")}
                    </button>
                  ) : null}
                  {step < 4 ? (
                    <button className="btn btn-primary" disabled={step === 2 && !selectedGiver} onClick={() => setStep((current) => (current < 4 ? ((current + 1) as 1 | 2 | 3 | 4) : current))}>
                      {t("continue")} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button className="btn btn-primary" disabled={!selectedGiver || isPending} onClick={submit}>
                      {isPending ? t("saving") : flowMode === "give" ? t("sendCard") : t("claimRecognition")} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {!done ? <p className="claim-support">{t("support")}</p> : null}
      </div>
    </section>
  );
}
