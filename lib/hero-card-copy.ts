const heroCardTextByLocale: Record<string, string> = {
  en: "Discover the power of recognition",
  nl: "Ontdek de kracht van waardering",
  fr: "Decouvrez le pouvoir de la reconnaissance",
  da: "Opdag styrken i anerkendelse"
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
  },
  fr: {
    sidebar: ["Accueil", "Cartes", "Equipe", "Signaux", "Insights"],
    settings: "Parametres",
    greeting: "Bonjour, Sarah",
    description: "La reconnaissance de l'equipe progresse ce trimestre.",
    period: "Ce trimestre",
    kpis: ["Energie", "Cartes partagees", "Qualites reconnues"],
    mobileKpis: ["Energie", "Cartes", "Qualites"],
    qualitiesTitle: "Qualites fortes",
    qualities: ["Empathie", "Proactif", "Collaboration", "Attention"],
    mobileQualities: ["Empathie", "Collaboration", "Creativite"],
    trendTitle: "Tendance",
    insight: "La reconnaissance augmente de 23% ce trimestre",
    mobileDashboard: "Tableau de reconnaissance",
    mobileTrend: "Tendance",
    mobileMonth: "Ce mois-ci",
    mobileInsight: "La reconnaissance augmente de 23%"
  },
  da: {
    sidebar: ["Hjem", "Kort", "Team", "Signaler", "Indsigter"],
    settings: "Indstillinger",
    greeting: "Godmorgen, Sarah",
    description: "Teamets anerkendelse stiger dette kvartal.",
    period: "Dette kvartal",
    kpis: ["Energi", "Kort delt", "Kvaliteter anerkendt"],
    mobileKpis: ["Energi", "Kort", "Kvaliteter"],
    qualitiesTitle: "Topkvaliteter",
    qualities: ["Empati", "Proaktiv", "Samarbejde", "Omsorg"],
    mobileQualities: ["Empati", "Samarbejde", "Kreativitet"],
    trendTitle: "Anerkendelsestrend",
    insight: "Anerkendelse er steget 23% dette kvartal",
    mobileDashboard: "Anerkendelsesdashboard",
    mobileTrend: "Trend",
    mobileMonth: "Denne maaned",
    mobileInsight: "Anerkendelse er steget 23%"
  }
} as const;

export function getHeroCardText(locale: string) {
  return heroCardTextByLocale[locale] ?? heroCardTextByLocale.en;
}

export function getHeroPreviewCopy(locale: string) {
  return heroPreviewCopyByLocale[locale as keyof typeof heroPreviewCopyByLocale] ?? heroPreviewCopyByLocale.en;
}
