"use client";

import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Table } from "@/components/ui/Table";

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

/** Team overview: person, cards in/out, monthly trend, energy level and top quality. */
export function TeamTable({ people }: { people: TeamMemberRow[] }) {
  const t = useTranslations("teamTable");

  return (
    <Table className="lp-table-flat lp-table-stack">
      <thead>
        <tr>
          <th scope="col">{t("member")}</th>
          <th scope="col" className="lp-c">{t("cardsReceived")}</th>
          <th scope="col" className="lp-c">{t("cardsGiven")}</th>
          <th scope="col" className="lp-c">{t("trend")}</th>
          <th scope="col">{t("energy")}</th>
          <th scope="col">{t("topQuality")}</th>
        </tr>
      </thead>
      <tbody>
        {people.map((person) => {
          const Trend = person.trend > 0 ? ArrowUpRight : person.trend < 0 ? ArrowDownRight : Minus;
          return (
            <tr key={person.id}>
              <td>
                <span className="lp-person">
                  <Avatar name={person.name} size="sm" />
                  <span>
                    <b>{person.name}</b>
                    <small>{person.team}</small>
                  </span>
                </span>
              </td>
              <td className="lp-c" data-label={t("cardsReceived")}>{person.cardsReceived}</td>
              <td className="lp-c" data-label={t("cardsGiven")}>{person.cardsGiven}</td>
              <td className="lp-c" data-label={t("trend")}>
                <span className={`lp-trend-chip${person.trend > 0 ? " lp-up" : person.trend < 0 ? " lp-down" : ""}`}>
                  <Trend aria-hidden="true" />
                  {person.trend > 0 ? "+" : ""}
                  {person.trend}
                </span>
              </td>
              <td data-label={t("energy")}>
                <Pill tone={person.energy === "HOOG" ? "green" : person.energy === "GEMIDDELD" ? "gold" : "neutral"}>{energyLabel(person.energy, t)}</Pill>
              </td>
              <td data-label={t("topQuality")}>{person.topQuality}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
