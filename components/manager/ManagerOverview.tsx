"use client";

import { useTranslations } from "next-intl";
import { Activity, Heart, UserRound, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { SignalList } from "@/components/SignalList";
import { TeamTable, type TeamMemberRow } from "@/components/TeamTable";
import { QualityBars, type QualityBarItem } from "@/components/QualityBars";
import { BarsChart } from "@/components/ui/BarsChart";
import { Grid } from "@/components/ui/Grid";
import { MeterList } from "@/components/ui/Meter";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";
import { StatCard } from "@/components/ui/StatCard";

type Signal = React.ComponentProps<typeof SignalList>["items"][number];

export type ManagerOverviewProps = {
  /** "noTeam" = manager has no team yet (empty states everywhere). */
  variant: "full" | "noTeam";
  metrics: { recognitions: number | string; engagement: number; members: number | string; signals: number | string };
  people: TeamMemberRow[];
  signals: Signal[];
  signalsHref: string;
  activity: { labels: string[]; values: number[]; hasData: boolean };
  qualities: QualityBarItem[];
  impact: { previous: number; current: number; percent: number; hasData: boolean };
};

/** Manager home: headline numbers, team table + signals, activity, qualities and quarterly impact. */
export function ManagerOverview({ variant, metrics, people, signals, signalsHref, activity, qualities, impact }: ManagerOverviewProps) {
  const t = useTranslations("manager");
  const empty = variant === "noTeam";
  const positive = impact.percent >= 0;

  return (
    <>
      <Grid cols="four">
        <StatCard icon={<Heart />} value={metrics.recognitions} label={t("totalRecognitions")} />
        <StatCard
          icon={<UsersRound />}
          value={`${metrics.engagement}%`}
          label={t("teamEngagement")}
          helper={
            <span className="lp-progress lp-progress-sm" role="presentation">
              <span style={{ width: `${Math.min(100, Math.max(0, metrics.engagement))}%` }} />
            </span>
          }
        />
        <StatCard icon={<UserRound />} value={metrics.members} label={t("activeMembers")} />
        <StatCard icon={<Activity />} value={metrics.signals} label={t("signals")} />
      </Grid>

      <Panel title={t("teamTable")}>
        {empty ? (
          <EmptyState eyebrow={t("emptyNoTeamEyebrow")} title={t("emptyNoTeamTitle")} copy={t("emptyNoTeamCopy")} />
        ) : people.length ? (
          <TeamTable people={people} />
        ) : (
          <EmptyState eyebrow={t("emptyMembersEyebrow")} title={t("emptyMembersTitle")} copy={t("emptyMembersCopy")} />
        )}
      </Panel>

      <Grid cols="two">
        <Panel title={t("teamSignals")} action={empty ? undefined : <a href={signalsHref}>{t("viewAll")}</a>}>
          {empty ? (
            <EmptyState eyebrow={t("emptySignalsPendingEyebrow")} title={t("emptySignalsPendingTitle")} copy={t("emptySignalsPendingCopy")} />
          ) : signals.length ? (
            <SignalList items={signals} />
          ) : (
            <EmptyState eyebrow={t("emptyNoSignalsEyebrow")} title={t("emptyNoSignalsTitle")} copy={t("emptyNoSignalsCopy")} />
          )}
        </Panel>

        <Panel title={t("impactTitle")} action={<Pill>{t("thisQuarter")}</Pill>}>
          {impact.hasData && !empty ? (
            <div className="lp-impact">
              <div className={`lp-impact-big ${positive ? "lp-up" : "lp-down"}`}>
                <b>
                  {impact.percent > 0 ? "+" : ""}
                  {impact.percent}%
                </b>
                <span>{impact.previous > 0 ? t("comparedLast") : t("comparedEmpty")}</span>
              </div>
              <MeterList
                items={[
                  { label: t("lastQuarter"), value: impact.previous, color: "#CFC3B1" },
                  { label: t("thisQuarter"), value: impact.current, color: "var(--purple)" }
                ]}
              />
              <p className="lp-hint" style={{ fontSize: 14.5 }}>{impact.previous > 0 ? t("impactCopy") : t("impactCopyEmpty")}</p>
            </div>
          ) : (
            <EmptyState eyebrow={t("emptyImpactEyebrow")} title={t("emptyImpactTitle")} copy={t(empty ? "emptyImpactCopy" : "emptyImpactCopyAlt")} />
          )}
        </Panel>
      </Grid>

      <Grid cols="two">
        <Panel title={t("activityTitle")} action={<Pill>{t("thisQuarter")}</Pill>}>
          {activity.hasData && !empty ? (
            <BarsChart height={200} labels={activity.labels} series={[{ name: t("totalRecognitions"), color: "var(--purple)", values: activity.values }]} />
          ) : (
            <EmptyState eyebrow={t("emptyActivityEyebrow")} title={t("emptyActivityTitle")} copy={t(empty ? "emptyActivityCopy" : "emptyActivityYetCopy")} />
          )}
        </Panel>

        <Panel title={t("topQualitiesTitle")}>
          {qualities.length && !empty ? (
            <QualityBars items={qualities} valueMode="count" />
          ) : (
            <EmptyState eyebrow={t("emptyQualitiesEyebrow")} title={t("emptyQualitiesTitle")} copy={t(empty ? "emptyQualitiesCopy" : "emptyQualitiesYetCopy")} />
          )}
        </Panel>
      </Grid>
    </>
  );
}
