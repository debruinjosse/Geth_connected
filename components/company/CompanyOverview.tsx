"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Equal } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { QualityBars, type QualityBarItem } from "@/components/QualityBars";
import { Card } from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { MeterList } from "@/components/ui/Meter";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { normalizeCategoryKey } from "@/lib/cards";

export type CompanyKpi = {
  key: string;
  icon: ReactNode;
  value: string | number;
  label: string;
  comparison?: { text: string; state: "positive" | "negative" | "neutral" | "new" };
  badge?: string;
  info?: string;
  sparkline?: number[];
};

export type CompanyOverviewProps = {
  kpis: CompanyKpi[];
  hasRecognitions: boolean;
  categories: Array<{ label: string; value: number; valueLabel: string }>;
  qualities: QualityBarItem[];
  trend: { points: number[]; labels: string[] };
  teams: Array<{ label: string; value: number; title?: string }>;
  teamsWaiting?: boolean;
};

const CATEGORY_COLOR: Record<string, string> = {
  Communication: "var(--cat-com)",
  Creativity: "var(--cat-cre)",
  Competence: "var(--cat-cmp)",
  Collegiality: "var(--cat-col)"
};

function Sparkline({ points, label }: { points: number[]; label: string }) {
  const width = 140;
  const height = 44;
  const pad = 5;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => [pad + index * step, height - pad - (point / max) * (height - pad * 2)] as const);
  const path = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg className="lp-spark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={path} fill="none" stroke="#7A6528" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {last ? <circle cx={last[0]} cy={last[1]} r="3.2" fill="#7A6528" /> : null}
    </svg>
  );
}

function KpiCard({ kpi, sparklineLabel }: { kpi: CompanyKpi; sparklineLabel: string }) {
  const Trend = kpi.comparison?.state === "positive" || kpi.comparison?.state === "new" ? ArrowUpRight : kpi.comparison?.state === "negative" ? ArrowDownRight : Equal;

  return (
    <Card size="sm" className="lp-stat lp-ckpi">
      <div className="lp-stat-top">
        <span className="lp-stat-icon" aria-hidden="true">
          {kpi.icon}
        </span>
        <span className="lp-ckpi-tools">
          {kpi.badge ? <Pill tone="gold">{kpi.badge}</Pill> : null}
          {kpi.info ? <InfoPopover text={kpi.info} /> : null}
        </span>
      </div>
      <b className="lp-stat-value">{kpi.value}</b>
      <span className="lp-stat-label">{kpi.label}</span>
      {kpi.sparkline ? <Sparkline points={kpi.sparkline} label={sparklineLabel} /> : null}
      {kpi.comparison ? (
        <small className={`lp-ckpi-cmp lp-${kpi.comparison.state}`}>
          <Trend aria-hidden="true" />
          {kpi.comparison.text}
        </small>
      ) : null}
    </Card>
  );
}

/** Company home: six KPIs, category + quality distribution, activity trend and team comparison. */
export function CompanyOverview({ kpis, hasRecognitions, categories, qualities, trend, teams, teamsWaiting }: CompanyOverviewProps) {
  const t = useTranslations("companyDashboard");
  const hasTrend = trend.points.some((value) => value > 0);
  const maxTeam = Math.max(...teams.map((team) => team.value), 1);

  return (
    <>
      <Grid cols="three" className="lp-ckpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} sparklineLabel={t("sparklineLabel")} />
        ))}
      </Grid>

      <Grid cols="two">
        <Panel title={t("categoryDistribution")} description={t("categoryDistributionCopy")}>
          {hasRecognitions ? (
            <MeterList
              items={categories.map((category) => ({
                label: category.label,
                value: category.value,
                valueLabel: category.valueLabel,
                color: CATEGORY_COLOR[normalizeCategoryKey(category.label)] ?? "var(--purple)"
              }))}
              max={100}
            />
          ) : (
            <EmptyState eyebrow={t("emptyRecognitionsEyebrow")} title={t("emptyCategoryTitle")} copy={t("emptyCategoryCopy")} />
          )}
        </Panel>

        <Panel title={t("topQualities")}>
          {qualities.length ? (
            <QualityBars items={qualities} />
          ) : (
            <EmptyState eyebrow={t("emptyQualitiesEyebrow")} title={t("emptyQualitiesTitle")} copy={t("emptyQualitiesCopy")} />
          )}
        </Panel>
      </Grid>

      <Grid cols="two">
        <Panel title={t("recognitionActivity")}>
          <LineChart points={trend.points} labels={trend.labels} ariaLabel={t("recognitionActivityChartLabel")} showValues />
          {!hasTrend ? <p className="lp-panel-note">{t("emptyTrendCopy")}</p> : null}
        </Panel>

        <Panel title={t("teamComparison")}>
          {teams.length ? (
            <>
              <MeterList items={teams.map((team) => ({ label: team.label, value: team.value, valueLabel: `${team.value}%`, color: "var(--purple)" }))} max={maxTeam} />
              {teamsWaiting ? <p className="lp-panel-note">{t("teamComparisonWaiting")}</p> : null}
            </>
          ) : (
            <EmptyState eyebrow={t("emptyTeamsEyebrow")} title={t("emptyTeamsTitle")} copy={t("emptyTeamsCopy")} />
          )}
        </Panel>
      </Grid>
    </>
  );
}
