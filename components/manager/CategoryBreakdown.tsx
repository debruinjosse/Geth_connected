import { EmptyState } from "@/components/EmptyState";
import { Grid } from "@/components/ui/Grid";
import { MeterList } from "@/components/ui/Meter";
import { Panel } from "@/components/ui/Panel";
import type { ManagerInsights } from "@/lib/data/manager-insights";

const CATEGORY_COLOR: Record<string, string> = {
  Communication: "var(--cat-com)",
  Creativity: "var(--cat-cre)",
  Competence: "var(--cat-cmp)",
  Collegiality: "var(--cat-col)"
};

type Labels = {
  title: string;
  copy: string;
  byTeamTitle: string;
  byTeamCopy: string;
  emptyTitle: string;
  emptyCopy: string;
  countLabel: (count: number) => string;
};

function segmentItems(segments: ManagerInsights["categorySegments"], countLabel: Labels["countLabel"]) {
  return segments.map((segment) => ({
    label: segment.label,
    value: segment.share,
    valueLabel: `${segment.share}% · ${countLabel(segment.count)}`,
    color: CATEGORY_COLOR[segment.category] ?? "var(--purple)"
  }));
}

/** Core-value ("per C") distribution for the whole managed scope plus one block per managed team, mirroring the company dashboard. */
export function CategoryBreakdown({ insights, labels }: { insights: ManagerInsights; labels: Labels }) {
  const hasData = insights.categorySegments.some((segment) => segment.count > 0);

  return (
    <>
      <Panel title={labels.title} description={labels.copy}>
        {hasData ? (
          <MeterList items={segmentItems(insights.categorySegments, labels.countLabel)} max={100} />
        ) : (
          <EmptyState title={labels.emptyTitle} copy={labels.emptyCopy} />
        )}
      </Panel>

      {insights.categoryByTeam.length ? (
        <Panel title={labels.byTeamTitle} description={labels.byTeamCopy}>
          <Grid cols="two">
            {insights.categoryByTeam.map((team) => (
              <div key={team.teamId} className="lp-stack" style={{ gap: 12 }}>
                <h3 style={{ fontSize: 16 }}>
                  {team.teamName} <small style={{ opacity: 0.6 }}>· {labels.countLabel(team.total)}</small>
                </h3>
                {team.total ? (
                  <MeterList items={segmentItems(team.segments, labels.countLabel)} max={100} />
                ) : (
                  <p className="lp-panel-note">{labels.emptyCopy}</p>
                )}
              </div>
            ))}
          </Grid>
        </Panel>
      ) : null}
    </>
  );
}
