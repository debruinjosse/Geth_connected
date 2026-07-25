"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, CheckCircle2, Gift, Heart, Megaphone, QrCode, Scale, Send, Sparkles } from "lucide-react";
import { approveRecognitionVerification } from "@/app/actions/recognitionVerification";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { SignalList } from "@/components/SignalList";
import { currentUser, employeeCategoryBreakdown, employeeGrowthPoints, employeeTopQualities, recognitions } from "@/lib/demo-data";
import { getStoredRecognitions, type StoredRecognition } from "@/lib/demo-session";

type QualityPill = {
  label: string;
  tone: string;
  count: number;
};

type CategoryBreakdown = {
  label: string;
  value: number;
  color: string;
};

type DashboardUser = {
  name: string;
  initials: string;
  team: string;
  imageUrl?: string | null;
};

type RecognitionSignal = {
  id: string;
  tone: string;
  title: string;
  detail: string;
  highlights?: Array<{ label: string; category: string; count: number; tone: string }>;
};

type PendingApproval = {
  id: string;
  receiverName: string;
  cardTitle: string;
  category: string;
  note: string | null;
  createdAt: string;
};

type EmployeeDashboardData = {
  mode: "demo" | "supabase";
  user: DashboardUser;
  title: string;
  subtitle: string;
  actionsLabel: string;
  cardsReceived: number;
  cardsGiven: number;
  energyScore: number;
  quartersActive: number;
  topQualitiesCount: number;
  topStrengthLabel?: string;
  recognitionSignals?: RecognitionSignal[];
  pendingApprovals?: PendingApproval[];
  topQualities: QualityPill[];
  categoryBreakdown: CategoryBreakdown[];
  recentRecognitions: RecognitionItem[];
  growthPoints: number[];
  givenGrowthPoints: number[];
  growthLabels: string[];
  unreadNotifications?: number;
};

const zeroCategoryBreakdown: CategoryBreakdown[] = [
  { label: "Communication", value: 0, color: "var(--theme-sky)" },
  { label: "Creativity", value: 0, color: "var(--theme-emerald)" },
  { label: "Competence", value: 0, color: "var(--theme-gold)" },
  { label: "Collegiality", value: 0, color: "var(--theme-purple-soft)" }
];

const zeroQualityRows: QualityPill[] = [
  { label: "Communication", tone: "var(--theme-sky)", count: 0 },
  { label: "Creativity", tone: "var(--theme-emerald)", count: 0 },
  { label: "Competence", tone: "var(--theme-gold)", count: 0 },
  { label: "Collegiality", tone: "var(--theme-purple-soft)", count: 0 }
];

export function EmployeeDashboardClient({ data }: { data?: EmployeeDashboardData }) {
  const locale = useLocale();
  const [storedRecognitions, setStoredRecognitions] = useState<StoredRecognition[]>([]);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(data?.pendingApprovals ?? []);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, startApprovalTransition] = useTransition();
  const resolvedData = data ?? {
    mode: "demo" as const,
    user: currentUser,
    title: "Welcome back, Sarah!",
    subtitle: "Great to see your impact grow.",
    actionsLabel: "This quarter",
    cardsReceived: 15,
    cardsGiven: 7,
    energyScore: 78,
    quartersActive: 3,
    topQualitiesCount: 11,
    topStrengthLabel: "Great communicator",
    recognitionSignals: [
      {
        id: "demo-signal-communication",
        tone: "var(--theme-sky)",
        title: "Great communicator",
        detail: "Communication cards are appearing most often in your recognition story."
      }
    ],
    pendingApprovals: [],
    topQualities: employeeTopQualities,
    categoryBreakdown: employeeCategoryBreakdown,
    recentRecognitions: recognitions.map((recognition) => ({
      id: recognition.id,
      from: recognition.from,
      to: recognition.to,
      card: recognition.card,
      category: recognition.category,
      note: recognition.note,
      date: recognition.date
    })),
    growthPoints: employeeGrowthPoints,
    givenGrowthPoints: [1, 0, 2, 1, 2, 1],
    growthLabels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    unreadNotifications: 0
  };
  useEffect(() => {
    if (resolvedData.mode === "demo") {
      setStoredRecognitions(getStoredRecognitions());
    }
  }, [resolvedData.mode]);

  useEffect(() => {
    setPendingApprovals(data?.pendingApprovals ?? []);
  }, [data?.pendingApprovals]);

  const recognitionItems = resolvedData.mode === "demo" ? [...storedRecognitions, ...resolvedData.recentRecognitions] : resolvedData.recentRecognitions;
  const hasAnyRecognitionItems = recognitionItems.length > 0;
  const firstName = resolvedData.user.name?.split(" ")[0] || "there";
  const displayCategories = [...(resolvedData.categoryBreakdown.length ? resolvedData.categoryBreakdown : zeroCategoryBreakdown)].sort((a, b) => b.value - a.value);
  const qualityRows = resolvedData.topQualities.length ? resolvedData.topQualities.slice(0, 3) : zeroQualityRows.slice(0, 3);
  const recognitionBalanceValue = `${resolvedData.cardsReceived} / ${resolvedData.cardsGiven}`;
  const receivedTrendPoints = resolvedData.growthPoints.length ? resolvedData.growthPoints : [0, 0, 0, 0, 0, 0];
  const givenTrendPoints = resolvedData.givenGrowthPoints.length ? resolvedData.givenGrowthPoints : [0, 0, 0, 0, 0, 0];
  const activityMax = Math.max(...receivedTrendPoints, ...givenTrendPoints, 1);
  const receivedActivityTotal = receivedTrendPoints.reduce((sum, value) => sum + value, 0);
  const givenActivityTotal = givenTrendPoints.reduce((sum, value) => sum + value, 0);
  const hasActivityItems = receivedActivityTotal + givenActivityTotal > 0;

  function approveRecognition(recognitionId: string) {
    setApprovingId(recognitionId);
    setApprovalMessage("");

    startApprovalTransition(async () => {
      const result = await approveRecognitionVerification(recognitionId);
      setApprovalMessage(result.message);

      if (result.ok) {
        setPendingApprovals((current) => current.filter((approval) => approval.id !== recognitionId));
      }

      setApprovingId(null);
    });
  }

  return (
    <DashboardShell
      role="employee"
      title={`Hi, welcome back, ${firstName}`}
      subtitle="Every recognition creates a stronger, more connected team."
      user={resolvedData.user}
      actions={
        <>
          <Link className="btn btn-primary compact" href={`/${locale}/employee/scan`}><QrCode size={16} /> Scan card</Link>
          <Link className="btn btn-dark compact" href={`/${locale}/cards`}><Gift size={16} /> Give a card</Link>
        </>
      }
      unreadNotifications={resolvedData.unreadNotifications ?? 0}
    >
      <div className="employee-dashboard">
        {announcementVisible ? (
          <section className="employee-hero">
            <div className="dashboard-announcement">
              <div className="announcement-icon">
                <Megaphone size={18} />
              </div>
              <p>Team update: recognition momentum is building. Scan a card to keep the momentum going!</p>
              <Link href={`/${locale}/employee/scan`}>Scan card <ArrowRight size={14} /></Link>
              <button className="announcement-close" type="button" onClick={() => setAnnouncementVisible(false)} aria-label="Dismiss announcement">x</button>
            </div>
          </section>
        ) : null}

        <section className="compact-metrics-grid">
          <MetricCard icon={<Heart />} value={resolvedData.cardsReceived} label="Recognitions received" helper="Total received" />
          <MetricCard icon={<Send />} value={resolvedData.cardsGiven} label="Recognitions given" helper="Shared impact" />
          <MetricCard icon={<Scale />} value={recognitionBalanceValue} label="Recognition balance" helper="Received / given" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <article className="metric-card top-qualities-card">
            <div>
              <span className="top-qualities-card-label">Top 3 qualities</span>
              <div className="top-quality-buttons" aria-label="Top three qualities by recognition count">
                {qualityRows.map((quality) => (
                  <span className="top-quality-button" key={quality.label} style={{ "--quality-tone": quality.tone } as CSSProperties}>
                    <strong>{quality.label}</strong>
                    <small>{quality.count} cards</small>
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        {resolvedData.recognitionSignals?.length ? (
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <div>
                <h2>AI recognition signals</h2>
                <p>A personal story generated from your strongest received cards, categories, and recognition momentum.</p>
              </div>
              <span className="quality-pill">{resolvedData.recognitionSignals.length} active</span>
            </div>
            <SignalList items={resolvedData.recognitionSignals} />
          </article>
        ) : null}

        {pendingApprovals.length ? (
          <article className="panel dashboard-panel approval-panel">
            <div className="panel-top">
              <div>
                <h2>Verify recognitions</h2>
                <p>Approve cards where a teammate selected you as the giver.</p>
              </div>
              <span className="quality-pill">{pendingApprovals.length} waiting</span>
            </div>
            <div className="approval-list">
              {pendingApprovals.map((approval) => (
                <div className="approval-card" key={approval.id}>
                  <div>
                    <span className="approval-eyebrow">Giver verification</span>
                    <strong>{approval.receiverName} says you gave them {approval.cardTitle}</strong>
                    <p>{approval.note || "No personal note was added."}</p>
                    <span className="quality-pill">{approval.category}</span>
                  </div>
                  <button className="btn btn-primary compact" type="button" disabled={isApproving && approvingId === approval.id} onClick={() => approveRecognition(approval.id)}>
                    <CheckCircle2 size={16} />
                    {isApproving && approvingId === approval.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              ))}
            </div>
            {approvalMessage ? <p className="section-copy" aria-live="polite">{approvalMessage}</p> : null}
          </article>
        ) : null}

        <section className="employee-analytics-grid">
          <article className="panel dashboard-panel trend-panel">
            <div className="panel-top">
              <div>
                <h2>Recognition activity</h2>
                <p>Monthly recognition volume at a glance.</p>
              </div>
              <span className="quality-pill">Last 6 months</span>
            </div>
            <div className="recognition-activity-summary" aria-label="Recognition activity totals">
              <span className="activity-total-chip received">Received <strong>{receivedActivityTotal}</strong></span>
              <span className="activity-total-chip given">Given <strong>{givenActivityTotal}</strong></span>
            </div>
            <div className="recognition-activity-compare" aria-label="Cards received and given by month">
              {resolvedData.growthLabels.map((label, index) => {
                const receivedValue = receivedTrendPoints[index] ?? 0;
                const givenValue = givenTrendPoints[index] ?? 0;
                const receivedWidth = receivedValue > 0 ? Math.max(8, Math.round((receivedValue / activityMax) * 100)) : 0;
                const givenWidth = givenValue > 0 ? Math.max(8, Math.round((givenValue / activityMax) * 100)) : 0;

                return (
                  <div className="recognition-activity-row" key={label}>
                    <span className="activity-month">{label}</span>
                    <div className="activity-lines">
                      <div className="activity-line received">
                        <span>Received</span>
                        <div className="activity-track">
                          <i style={{ width: `${receivedWidth}%` }} />
                        </div>
                        <strong>{receivedValue}</strong>
                      </div>
                      <div className="activity-line given">
                        <span>Given</span>
                        <div className="activity-track">
                          <i style={{ width: `${givenWidth}%` }} />
                        </div>
                        <strong>{givenValue}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!hasActivityItems ? <p className="section-copy">No recognitions yet, so this trend is currently at 0.</p> : null}
          </article>

          <article className="panel dashboard-panel category-panel">
            <div className="panel-top">
              <div>
                <h2>Four C category distribution</h2>
                <p>Communication, Creativity, Competence, and Collegiality made easy to compare.</p>
              </div>
            </div>
            <BarChart
              compact
              items={displayCategories.map((item) => ({
                label: item.label,
                value: item.value,
                valueLabel: `${item.value} ${item.value === 1 ? "card" : "cards"}`,
                color: item.color
              }))}
            />
            {!hasAnyRecognitionItems ? <p className="section-copy">Category totals are ready and currently at 0.</p> : null}
          </article>

          <article className="panel dashboard-panel qualities-panel">
            <div className="panel-top">
              <div>
                <h2>Your top qualities</h2>
                <p>Strengths reflected by your colleagues.</p>
              </div>
            </div>
            <div className="quality-count-list">
              {qualityRows.map((quality) => (
                <div className="quality-count-row" key={quality.label}>
                  <span>{quality.label}</span>
                  <strong>{quality.count} cards</strong>
                </div>
              ))}
            </div>
            <Link className="panel-link" href={`/${locale}/employee/growth`}>Growth insights <ArrowRight size={14} /></Link>
            {!hasAnyRecognitionItems ? <p className="section-copy">Top qualities are ready and currently at 0.</p> : null}
          </article>
        </section>

        <section className="employee-lower-grid">
          <article className="panel dashboard-panel recent-recognition-panel">
            <div className="panel-top">
              <div>
                <h2>Recent recognitions</h2>
                <p>Your latest claimed cards and messages.</p>
              </div>
              <Link href={`/${locale}/employee/cards`}>View all</Link>
            </div>
            {hasAnyRecognitionItems ? (
              <RecognitionList items={recognitionItems} compact />
            ) : (
              <EmptyState
                eyebrow="No recognitions yet"
                title="Your recognition feed is still getting started"
                copy="Claim your first GETH card to start building a visible history of appreciation and growth."
                actionLabel="Browse cards"
                actionHref={`/${locale}/cards`}
              />
            )}
          </article>

          <article className="employee-cta-panel">
            <div className="cta-orbit">
              <Sparkles size={22} />
            </div>
            <div>
              <h2>Scan a physical card</h2>
              <p>Use your camera to claim a GETH card from its QR code.</p>
            </div>
            <Link className="btn btn-dark" href={`/${locale}/employee/scan`}>
              Scan card <QrCode size={16} />
            </Link>
            <Link className="btn btn-secondary" href={`/${locale}/cards`}>
              Give a card <Gift size={16} />
            </Link>
          </article>
        </section>
      </div>
    </DashboardShell>
  );
}
