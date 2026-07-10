"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Heart, Megaphone, Send, Sparkles, Star, Zap } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { MetricCard } from "@/components/MetricCard";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { currentUser, employeeCategoryBreakdown, employeeGrowthPoints, employeeTopQualities, recognitions } from "@/lib/demo-data";
import { getStoredRecognitions, type StoredRecognition } from "@/lib/demo-session";

type QualityPill = {
  label: string;
  tone: string;
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
  topQualities: QualityPill[];
  categoryBreakdown: CategoryBreakdown[];
  recentRecognitions: RecognitionItem[];
  growthPoints: number[];
  growthLabels: string[];
  unreadNotifications?: number;
};

const zeroCategoryBreakdown: CategoryBreakdown[] = [
  { label: "Communication", value: 0, color: "var(--theme-emerald)" },
  { label: "Creativity", value: 0, color: "var(--theme-gold)" },
  { label: "Competence", value: 0, color: "var(--theme-orange)" },
  { label: "Collegiality", value: 0, color: "var(--theme-blue)" }
];

const zeroQualityRows: Array<QualityPill & { value: number }> = [
  { label: "Communication", tone: "var(--theme-emerald)", value: 0 },
  { label: "Creativity", tone: "var(--theme-gold)", value: 0 },
  { label: "Competence", tone: "var(--theme-orange)", value: 0 },
  { label: "Collegiality", tone: "var(--theme-blue)", value: 0 }
];

export function EmployeeDashboardClient({ data }: { data?: EmployeeDashboardData }) {
  const [storedRecognitions, setStoredRecognitions] = useState<StoredRecognition[]>([]);
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
    growthLabels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    unreadNotifications: 0
  };
  useEffect(() => {
    if (resolvedData.mode === "demo") {
      setStoredRecognitions(getStoredRecognitions());
    }
  }, [resolvedData.mode]);

  const recognitionItems = resolvedData.mode === "demo" ? [...storedRecognitions, ...resolvedData.recentRecognitions] : resolvedData.recentRecognitions;
  const hasAnyRecognitionItems = recognitionItems.length > 0;
  const firstName = resolvedData.user.name?.split(" ")[0] || "there";
  const topQuality = resolvedData.topQualities[0]?.label ?? `${resolvedData.topQualitiesCount} qualities`;
  const displayCategories = resolvedData.categoryBreakdown.length ? resolvedData.categoryBreakdown : zeroCategoryBreakdown;
  const categoryTotal = displayCategories.reduce((sum, item) => sum + item.value, 0);
  const maxCategory = Math.max(...displayCategories.map((item) => item.value), 1);
  const qualityRows = resolvedData.topQualities.length
    ? resolvedData.topQualities.slice(0, 5).map((quality, index) => ({
        ...quality,
        value: Math.max(28, 92 - index * 13)
      }))
    : zeroQualityRows;
  const trendPoints = resolvedData.growthPoints.length ? resolvedData.growthPoints : [0, 0, 0, 0, 0, 0];

  return (
    <DashboardShell
      role="employee"
      title={`Good evening, ${firstName}`}
      subtitle="Every recognition creates a stronger, more connected team."
      user={resolvedData.user}
      actions={<span className="quality-pill">{resolvedData.actionsLabel}</span>}
      unreadNotifications={resolvedData.unreadNotifications ?? 0}
    >
      <div className="employee-dashboard">
        <section className="employee-hero">
          <div className="dashboard-announcement">
            <div className="announcement-icon">
              <Megaphone size={18} />
            </div>
            <p>Team update: Recognition momentum is building. Claim a card or recognize a teammate today.</p>
            <a href="/cards">Browse cards <ArrowRight size={14} /></a>
            <span className="announcement-close" aria-hidden="true">x</span>
          </div>
        </section>

        <section className="compact-metrics-grid">
          <MetricCard icon={<Heart />} value={resolvedData.cardsReceived} label="Cards received" helper="Total claimed" />
          <MetricCard icon={<Send />} value={resolvedData.cardsGiven} label="Cards given" helper="Shared impact" />
          <MetricCard icon={<Zap />} value={`${resolvedData.energyScore}%`} label="Energy score" helper="Recognition health" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<CalendarDays />} value={resolvedData.quartersActive} label="Quarters active" helper="Consistent growth" />
          <MetricCard icon={<Star />} value={topQuality} label="Top quality" helper={`${resolvedData.topQualitiesCount} strengths seen`} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        </section>

        <section className="employee-analytics-grid">
          <article className="panel dashboard-panel trend-panel">
            <div className="panel-top">
              <div>
                <h2>Recognition trend</h2>
                <p>Momentum across your recent recognitions.</p>
              </div>
              <span className="quality-pill">Last 6 months</span>
            </div>
            <LineChart color="var(--theme-emerald)" points={trendPoints} labels={resolvedData.growthLabels} compact />
            {!hasAnyRecognitionItems ? <p className="section-copy">No recognitions yet, so this trend is currently at 0.</p> : null}
          </article>

          <article className="panel dashboard-panel category-panel">
            <div className="panel-top">
              <div>
                <h2>Recognitions by category</h2>
                <p>Where your recognition is showing up.</p>
              </div>
            </div>
            <div className="distribution-list compact-bars">
                {displayCategories.map((item) => {
                  const percent = categoryTotal ? Math.round((item.value / categoryTotal) * 100) : 0;
                  return (
                    <div className="bar-row" key={item.label}>
                      <span>{item.label}</span>
                      <div className="bar-track">
                        <span style={{ width: `${Math.max((item.value / maxCategory) * 100, 8)}%`, background: item.color }} />
                      </div>
                      <strong>{categoryTotal ? `${percent}%` : item.value}</strong>
                    </div>
                  );
                })}
              </div>
            {!hasAnyRecognitionItems ? <p className="section-copy">Category totals are ready and currently at 0.</p> : null}
          </article>

          <article className="panel dashboard-panel qualities-panel">
            <div className="panel-top">
              <div>
                <h2>Your top qualities</h2>
                <p>Strengths reflected by your colleagues.</p>
              </div>
            </div>
            <div className="quality-progress-list">
              {qualityRows.map((quality) => (
                <div className="quality-progress-row" key={quality.label}>
                  <div>
                    <span>{quality.label}</span>
                    <strong>{quality.value}%</strong>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${quality.value}%`, background: quality.tone }} />
                  </div>
                </div>
              ))}
            </div>
            <a className="panel-link" href="/employee/growth">Growth insights <ArrowRight size={14} /></a>
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
              <a href="/employee/cards">View all</a>
            </div>
            {hasAnyRecognitionItems ? (
              <RecognitionList items={recognitionItems} compact />
            ) : (
              <EmptyState
                eyebrow="No recognitions yet"
                title="Your recognition feed is still getting started"
                copy="Claim your first GETH card to start building a visible history of appreciation and growth."
                actionLabel="Browse cards"
                actionHref="/cards"
              />
            )}
          </article>

          <article className="employee-cta-panel">
            <div className="cta-orbit">
              <Sparkles size={22} />
            </div>
            <div>
              <h2>Keep the momentum going</h2>
              <p>Browse cards to recognize a teammate today.</p>
            </div>
            <a className="btn btn-dark" href="/cards">
              Browse cards <ArrowRight size={16} />
            </a>
          </article>
        </section>
      </div>
    </DashboardShell>
  );
}
