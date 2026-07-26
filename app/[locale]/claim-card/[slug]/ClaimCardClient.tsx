"use client";

import Link from "next/link";
import Image from "next/image";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Search } from "lucide-react";
import { claimRecognition, giveRecognition } from "@/app/actions/claimRecognition";
import { GethCardVisual } from "@/components/GethCardVisual";
import { getLocalizedCardTitle, getLocalizedCategoryDisplayName, type GethCard } from "@/lib/cards";
import { people } from "@/lib/demo-data";
import { hasSupabaseBrowserConfig, saveStoredRecognition } from "@/lib/demo-session";

const claimStages = ["Card", "Giver", "Note", "Confirm"] as const;
const giveStages = ["Card", "Receiver", "Note", "Confirm"] as const;
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
  locale
}: {
  card: GethCard | null;
  requestedSlug: string;
  giverOptions?: ClaimGiverOption[];
  receiverName?: string;
  locale: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const flowMode = searchParams.get("mode") === "give" ? "give" : "claim";
  const stages = flowMode === "give" ? giveStages : claimStages;
  const claimOrigin = flowMode === "give" ? "card_library" : source === "qr_scan" ? "qr_scan" : source === "manual_entry" ? "manual_entry" : "direct_link";
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
  const displayCard = card
    ? {
        ...card,
        title: getLocalizedCardTitle(card, locale),
        category: getLocalizedCategoryDisplayName(card.category, locale)
      }
    : null;

  if (!card) {
    return (
      <div className="claim-empty">
        <section className="panel claim-empty-card">
          <div className="eyebrow">Card not found</div>
          <h1 style={{ margin: "12px 0", fontSize: 52 }}>We couldn&apos;t find &ldquo;{requestedSlug}&rdquo;.</h1>
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

  function chooseGiver(giverId: string) {
    setSelectedGiver(giverId);
    setStep(3);
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
              claimOrigin: "card_library"
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
              ? `${localePrefix}/claim-card/${requestedSlug}?mode=give`
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
          giverId: selectedGiver,
          giverName: flowMode === "give" ? resolvedReceiverName : selectedPerson?.name ?? "Unknown giver",
          receiverName: flowMode === "give" ? selectedPerson?.name ?? "A teammate" : resolvedReceiverName,
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
                <strong>{stage}</strong>
              </div>
            );
          })}
        </div>

        <GethCardVisual card={displayCard ?? card} variant="claim" />
      </div>

      <div className="claim-right">
        <section className="claim-form">
          {done ? (
            <div className="claim-success-state">
              <CheckCircle2 size={70} color="var(--theme-emerald)" />
              <h2>{flowMode === "give" ? "Recognition sent" : "Recognition claimed"}</h2>
              <p>
                {flowMode === "give"
                  ? `${selectedPerson?.name ?? "Your teammate"} will receive a notification to acknowledge this card.`
                  : "This card has been added to your dashboard, the giver's dashboard, and company insights."}
              </p>
              <div className="claim-success-actions">
                <Link className="btn btn-dark" href={`${localePrefix}/employee`}>
                  Open my dashboard
                </Link>
                <Link className="btn btn-secondary" href={`${localePrefix}/cards`}>
                  {flowMode === "give" ? "Give another card" : "Claim another card"}
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
                    <h2>{flowMode === "give" ? "Give this recognition card." : "This is your recognition card."}</h2>
                    {flowMode === "give" ? <p>Start by choosing the teammate who should receive this GETH card.</p> : null}
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <h2>{flowMode === "give" ? "Who do you want to give this card to?" : "Who gave you this card?"}</h2>
                    <p>
                      {flowMode === "give"
                        ? "Search by name or team and choose the teammate who should receive this recognition."
                        : "Search by name or team and choose the colleague who handed you this GETH card."}
                    </p>
                    <div className="form-field">
                      <label htmlFor="giver-search">Search by name or team</label>
                      <div className="input-wrap">
                        <Search size={18} style={{ position: "absolute", left: 16, top: 18, color: "var(--theme-muted)" }} />
                        <input
                          id="giver-search"
                          className="input"
                          style={{ paddingLeft: 46 }}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search by name or team"
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
                            <input type="radio" name="giver" value={person.id} checked={selectedGiver === person.id} onChange={(event) => chooseGiver(event.target.value)} />
                          </label>
                        ))
                      ) : (
                        <div className="person-option" aria-live="polite">
                          <div className="person-details">
                            <div>
                              <strong>No colleagues found</strong>
                              <p style={{ margin: "4px 0 0" }}>
                                {hasSupabaseBrowserConfig()
                                  ? `Log in with a company-linked profile to load ${flowMode === "give" ? "recipient" : "giver"} options.`
                                  : `Try another search or ask your admin to add the ${flowMode === "give" ? "recipient" : "giver"}.`}
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
                    <h2>{flowMode === "give" && selectedPerson ? `You are giving this card to ${selectedPerson.name}.` : "Add a personal note"}</h2>
                    <p>
                      {flowMode === "give"
                        ? "Add a short message so they know exactly what you appreciated."
                        : "This is optional, but a thank-you message makes the recognition feel even more personal."}
                    </p>
                    {selectedPerson ? (
                      <div className="selected-giver-card">
                        <span className="approval-eyebrow">{flowMode === "give" ? "Selected receiver" : "Selected giver"}</span>
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
                      <label htmlFor="note">Your note</label>
                      <textarea
                        id="note"
                        className="input"
                        maxLength={280}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={
                          flowMode === "give"
                            ? "I am giving you this card because I noticed the way you..."
                            : "Thank you for recognising this today. It really meant a lot."
                        }
                      />
                      <span className="field-help">{note.length}/280 characters</span>
                    </div>
                  </>
                ) : null}

                {step === 4 ? (
                  <>
                    <h2>{flowMode === "give" ? "Confirm this card gift" : "Confirm your recognition"}</h2>
                    <p className="claim-step-copy">
                      {flowMode === "give"
                        ? "Review the card, receiver, and note before you send it for acknowledgement."
                        : "Review the card, giver, and note before you create the recognition event."}
                    </p>
                    <div className="claim-summary">
                      <div className="claim-summary-row">
                        <strong>Card</strong>
                        <p>{displayCard?.title ?? card.title}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Category</strong>
                        <p>{displayCard?.category ?? card.category}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Receiver</strong>
                        <p>{flowMode === "give" ? selectedPerson?.name ?? "No receiver selected" : resolvedReceiverName}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Given by</strong>
                        <p>{flowMode === "give" ? resolvedReceiverName : selectedPerson ? `${selectedPerson.name} - ${selectedPerson.team}` : "No giver selected"}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Note</strong>
                        <p>{note || "No note added."}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Claim source</strong>
                        <p>
                          {flowMode === "give"
                            ? "Given from card library"
                            : claimOrigin === "qr_scan"
                              ? "Physical QR scan"
                              : claimOrigin === "manual_entry"
                                ? "Manual QR entry"
                                : "Direct digital link"}
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
                  <button className="btn btn-secondary" onClick={() => setStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4) : current))}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  {step < 4 ? (
                    <button className="btn btn-primary" disabled={step === 2 && !selectedGiver} onClick={() => setStep((current) => (current < 4 ? ((current + 1) as 1 | 2 | 3 | 4) : current))}>
                      Continue <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button className="btn btn-primary" disabled={!selectedGiver || isPending} onClick={submit}>
                      {isPending ? "Saving..." : flowMode === "give" ? "Send card" : "Claim recognition"} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {!done ? <p className="claim-support">Can&apos;t find the person? Ask your admin to add them.</p> : null}
      </div>
    </section>
  );
}
