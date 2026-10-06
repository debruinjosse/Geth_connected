/* eslint-disable @next/next/no-img-element */
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";

const MILESTONES = [
  { file: "geth_badge_01_nieuw", key: "b1", at: 0 },
  { file: "geth_badge_02_zichtbaar", key: "b2", at: 1 },
  { file: "geth_badge_03_erkend", key: "b3", at: 5 },
  { file: "geth_badge_04_groeiend", key: "b4", at: 10 },
  { file: "geth_badge_05_verbindend", key: "b5", at: 20 },
  { file: "geth_badge_06_inspirerend", key: "b6", at: 40 }
] as const;

/** Six bird-shield milestones: achieved ones in colour, locked ones greyed, with progress to the next. */
export function MilestoneCard({ received }: { received: number }) {
  const t = useTranslations("employeeHome");
  const names = useTranslations("landingV2");

  let current = 0;
  MILESTONES.forEach((milestone, index) => {
    if (received >= milestone.at) current = index;
  });
  const next = MILESTONES[current + 1];
  const from = MILESTONES[current].at;
  const percent = next ? Math.min(100, Math.round(((received - from) / (next.at - from)) * 100)) : 100;

  return (
    <Card size="lg" className="lp-miles-card">
      <div className="lp-miles">
        <div className="lp-miles-copy">
          <span className="lp-eyebrow">{t("milestoneEyebrow")}</span>
          <h2>{names(MILESTONES[current].key)}</h2>
          <p>{next ? t("milestoneNext", { count: next.at - received, badge: names(next.key) }) : t("milestoneTop")}</p>
          <div className="lp-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <span style={{ width: `${percent}%` }} />
          </div>
          <div className="lp-miles-count">
            <span>{t("milestoneReceived", { count: received })}</span>
            {next ? <span>{next.at}</span> : null}
          </div>
        </div>
        <div className="lp-miles-row">
          {MILESTONES.map((milestone, index) => (
            <div key={milestone.file} className={cx("lp-mile", index === current && "lp-current", index > current && "lp-locked-m")}>
              <img src={`/landing/badges/${milestone.file}.svg`} alt="" />
              <span>{names(milestone.key)}</span>
              <small>{milestone.at === 0 ? "" : `${milestone.at}+`}</small>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
