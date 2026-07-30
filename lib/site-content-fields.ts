export type SiteContentNamespace = "home";

export const HOME_CONTENT_FIELDS: Array<{ key: string; label: string; multiline?: boolean }> = [
  { key: "ctaEyebrow", label: "Hero eyebrow" },
  { key: "ctaTitle", label: "Hero headline" },
  { key: "heroDetail", label: "Hero detail paragraph", multiline: true },
  { key: "seeHow", label: "Secondary CTA (See how it works)" },
  { key: "trustSecure", label: "Trust: Secure & private" },
  { key: "trustInsights", label: "Trust: Actionable insights" },
  { key: "trustTeams", label: "Trust: Built for teams" },
  { key: "scrollExplore", label: "Scroll hint" },
  { key: "companiesLabel", label: "Audience: Companies label" },
  { key: "companiesTitle", label: "Audience: Companies title" },
  { key: "companiesCopy", label: "Audience: Companies copy", multiline: true },
  { key: "managersLabel", label: "Audience: Managers label" },
  { key: "managersTitle", label: "Audience: Managers title" },
  { key: "managersCopy", label: "Audience: Managers copy", multiline: true },
  { key: "employeesLabel", label: "Audience: Employees label" },
  { key: "employeesTitle", label: "Audience: Employees title" },
  { key: "employeesCopy", label: "Audience: Employees copy", multiline: true }
];
