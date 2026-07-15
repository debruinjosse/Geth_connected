"use client";

import Link from "next/link";
import Image from "next/image";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Search } from "lucide-react";
import { claimRecognition } from "@/app/actions/claimRecognition";
import { GethCardVisual } from "@/components/GethCardVisual";
import type { GethCard } from "@/lib/cards";
import { people } from "@/lib/demo-data";
import { hasSupabaseBrowserConfig, saveStoredRecognition } from "@/lib/demo-session";

const stages = ["Card", "Giver", "Note", "Confirm"] as const;
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
  receiverName
}: {
  card: GethCard | null;
  requestedSlug: string;
  giverOptions?: ClaimGiverOption[];
  receiverName?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const claimOrigin = source === "qr_scan" ? "qr_scan" : source === "manual_entry" ? "manual_entry" : "direct_link";
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

  if (!card) {
    return (
      <div className="claim-empty">
        <section className="panel claim-empty-card">
          <div className="eyebrow">Card not found</div>
          <h1 style={{ margin: "12px 0", fontSize: 52 }}>We couldn&apos;t find &ldquo;{requestedSlug}&rdquo;.</h1>
          <p className="section-copy">The QR route may be inactive, renamed, or not part of this deck.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
            <Link className="btn btn-dark" href="/cards">
              Open card library
            </Link>
            <Link className="btn btn-secondary" href="/">
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
  const previewPeople = availablePeople.slice(0, 6);

  const selectedPerson = availablePeople.find((person) => person.id === selectedGiver);

  function submit() {
    if (!selectedGiver || !card) return;

    startTransition(async () => {
      setSubmitError("");
      const result = await claimRecognition({
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
          const nextUrl = `/claim-card/${requestedSlug}${claimOrigin === "qr_scan" ? "?source=qr_scan" : ""}`;
          router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        }
        return;
      }

      if (!hasSupabaseBrowserConfig()) {
        saveStoredRecognition({
          id: `stored-${Date.now()}`,
          cardSlug: card.slug,
          cardTitle: card.title,
          category: card.category,
          giverId: selectedGiver,
          giverName: selectedPerson?.name ?? "Unknown giver",
          receiverName: resolvedReceiverName,
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

        <GethCardVisual card={card} variant="claim" />
      </div>

      <div className="claim-right">
        <section className="claim-form">
          {done ? (
            <div style={{ textAlign: "center", padding: "42px 10px" }}>
              <CheckCircle2 size={70} color="var(--theme-emerald)" />
              <h2 style={{ marginTop: 22 }}>Recognition claimed</h2>
              <p>This card has been added to your dashboard, the giver&apos;s dashboard, and company insights.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
                <Link className="btn btn-dark" href="/employee">
                  Open my dashboard
                </Link>
                <Link className="btn btn-secondary" href="/cards">
                  Claim another card
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
                    <h2>This is your recognition card.</h2>
                    <p>
                      Review the card details, then continue to tell us who gave it to you.
                      {claimOrigin === "qr_scan" ? " This claim started from a scanned physical card." : ""}
                    </p>
                    <div className="claim-company-preview">
                      <div className="panel-top">
                        <div>
                          <h3>People in your company</h3>
                          <p>These colleagues can be selected as the giver in the next step.</p>
                        </div>
                      </div>
                      {previewPeople.length ? (
                        <div className="claim-people-preview-grid">
                          {previewPeople.map((person) => (
                            <div className="claim-person-mini" key={person.id}>
                              <ProfileAvatar person={person} />
                              <div>
                                <strong>{person.name}</strong>
                                <p>{person.team}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="section-copy">Log in with a company-linked profile to load your colleague list.</p>
                      )}
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <h2>Who gave you this card?</h2>
                    <p>Search by name or team and choose the colleague who handed you this GETH card.</p>
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
                            <input type="radio" name="giver" value={person.id} checked={selectedGiver === person.id} onChange={(event) => setSelectedGiver(event.target.value)} />
                          </label>
                        ))
                      ) : (
                        <div className="person-option" aria-live="polite">
                          <div className="person-details">
                            <div>
                              <strong>No colleagues found</strong>
                              <p style={{ margin: "4px 0 0" }}>
                                {hasSupabaseBrowserConfig()
                                  ? "Log in with a company-linked profile to load giver options."
                                  : "Try another search or ask your admin to add the giver."}
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
                    <h2>Add a personal note</h2>
                    <p>This is optional, but a thank-you message makes the recognition feel even more personal.</p>
                    <div className="form-field">
                      <label htmlFor="note">Your note</label>
                      <textarea
                        id="note"
                        className="input"
                        maxLength={280}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Thank you for recognising this today. It really meant a lot."
                      />
                      <span className="field-help">{note.length}/280 characters</span>
                    </div>
                  </>
                ) : null}

                {step === 4 ? (
                  <>
                    <h2>Confirm your recognition</h2>
                    <p>Review the card, giver, and note before you create the recognition event.</p>
                    <div className="claim-summary">
                      <div className="claim-summary-row">
                        <strong>Card</strong>
                        <p>{card.title}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Category</strong>
                        <p>{card.category}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Receiver</strong>
                        <p>{resolvedReceiverName}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Given by</strong>
                        <p>{selectedPerson ? `${selectedPerson.name} · ${selectedPerson.team}` : "No giver selected"}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Note</strong>
                        <p>{note || "No note added."}</p>
                      </div>
                      <div className="claim-summary-row">
                        <strong>Claim source</strong>
                        <p>{claimOrigin === "qr_scan" ? "Physical QR scan" : claimOrigin === "manual_entry" ? "Manual QR entry" : "Direct digital link"}</p>
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
                      {isPending ? "Saving..." : "Claim recognition"} <ArrowRight size={16} />
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
