const heroCardTextByLocale: Record<string, string> = {
  en: "Discover the power of recognition",
  nl: "Ontdek de kracht van waardering",
};

const heroPreviewCopyByLocale = {
  en: {
    sidebar: ["Home", "Cards", "Team", "Signals", "Insights"],
    settings: "Settings",
    greeting: "Good morning, Sarah",
    description: "Team recognition is trending upward this quarter.",
    period: "This quarter",
    kpis: ["Energy", "Cards shared", "Qualities recognized"],
    mobileKpis: ["Energy", "Cards", "Qualities"],
    qualitiesTitle: "Top qualities",
    qualities: ["Empathy", "Proactive", "Collaboration", "Care"],
    mobileQualities: ["Empathy", "Collaboration", "Creativity"],
    trendTitle: "Recognition trend",
    insight: "Recognition is up 23% this quarter",
    mobileDashboard: "Recognition dashboard",
    mobileTrend: "Trend",
    mobileMonth: "This month",
    mobileInsight: "Recognition is up 23%"
  },
  nl: {
    sidebar: ["Home", "Kaarten", "Team", "Signalen", "Inzichten"],
    settings: "Instellingen",
    greeting: "Goedemorgen, Sarah",
    description: "Teamwaardering groeit dit kwartaal zichtbaar.",
    period: "Dit kwartaal",
    kpis: ["Energie", "Kaarten gedeeld", "Kwaliteiten herkend"],
    mobileKpis: ["Energie", "Kaarten", "Kwaliteiten"],
    qualitiesTitle: "Topkwaliteiten",
    qualities: ["Empathie", "Proactief", "Samenwerking", "Zorgzaam"],
    mobileQualities: ["Empathie", "Samenwerking", "Creativiteit"],
    trendTitle: "Waarderingstrend",
    insight: "Waardering stijgt dit kwartaal met 23%",
    mobileDashboard: "Waarderingsdashboard",
    mobileTrend: "Trend",
    mobileMonth: "Deze maand",
    mobileInsight: "Waardering stijgt met 23%"
  }
} as const;

export function getHeroCardText(locale: string) {
  return heroCardTextByLocale[locale] ?? heroCardTextByLocale.en;
}

export function getHeroPreviewCopy(locale: string) {
  return heroPreviewCopyByLocale[locale as keyof typeof heroPreviewCopyByLocale] ?? heroPreviewCopyByLocale.en;
}
