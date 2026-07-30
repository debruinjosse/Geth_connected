"use client";

import { useTranslations } from "next-intl";

export type TeamMemberRow = {
  id: string;
  name: string;
  team: string;
  cardsReceived: number;
  cardsGiven: number;
  trend: number;
  energy: "HOOG" | "GEMIDDELD" | "LAAG";
  topQuality: string;
};

function energyLabel(energy: TeamMemberRow["energy"], t: ReturnType<typeof useTranslations>) {
  switch (energy) {
    case "HOOG":
      return t("energyHigh");
    case "LAAG":
      return t("energyLow");
    default:
      return t("energyMid");
  }
}

export function TeamTable({ people }: { people: TeamMemberRow[] }) {
  const t = useTranslations("teamTable");

  return (
    <div className="table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>{t("member")}</th>
            <th>{t("cardsReceived")}</th>
            <th>{t("cardsGiven")}</th>
            <th>{t("trend")}</th>
            <th>{t("energy")}</th>
            <th>{t("topQuality")}</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td>
                <strong>{person.name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--theme-muted)" }}>{person.team}</p>
              </td>
              <td>{person.cardsReceived}</td>
              <td>{person.cardsGiven}</td>
              <td style={{ color: person.trend < 0 ? "var(--theme-red)" : "var(--theme-emerald)", fontWeight: 700 }}>
                {person.trend > 0 ? "+" : ""}
                {person.trend}
              </td>
              <td>
                <span className={`energy ${person.energy === "HOOG" ? "high" : person.energy === "LAAG" ? "low" : "mid"}`}>
                  {energyLabel(person.energy, t)}
                </span>
              </td>
              <td>{person.topQuality}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
