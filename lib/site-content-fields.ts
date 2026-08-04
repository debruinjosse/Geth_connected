export type SiteContentNamespace = "home";

export type SiteContentField = { key: string; label: string; multiline?: boolean };

export type HomeContentSection = {
  id: string;
  title: string;
  description?: string;
  fields: SiteContentField[];
  enOnlySettings?: boolean;
};

export const HOME_HERO_FIELDS: SiteContentField[] = [
  { key: "ctaEyebrow", label: "Eyebrow" },
  { key: "ctaTitle", label: "Headline" },
  { key: "heroDetail", label: "Supporting paragraph", multiline: true },
  { key: "seeHow", label: "Secondary CTA label" },
  { key: "trustSecure", label: "Trust label: Secure & private" },
  { key: "trustInsights", label: "Trust label: Actionable insights" },
  { key: "trustTeams", label: "Trust label: Built for teams" },
  { key: "scrollExplore", label: "Scroll hint" }
];

export const HOME_VALUE_PROPOSITION_FIELDS: SiteContentField[] = [
  { key: "valuePropEyebrow", label: "Eyebrow" },
  { key: "valuePropHeadline", label: "Headline" },
  { key: "valuePropParagraph", label: "Supporting paragraph", multiline: true },
  { key: "valuePropCtaLabel", label: "CTA label (optional)" },
  { key: "valuePropCtaHref", label: "CTA link (optional)" },
  { key: "viewPricing", label: "Secondary link label" }
];

export const HOME_MARQUEE_SETTING_FIELDS: SiteContentField[] = [
  { key: "marqueeEnabled", label: "Enable marquee" },
  { key: "marqueeScrollSpeed", label: "Scroll speed (seconds)" },
  { key: "marqueeBackgroundColor", label: "Background colour" },
  { key: "marqueeTextColor", label: "Text colour" },
  { key: "marqueeDividerStyle", label: "Divider style" }
];

export const HOME_HOW_IT_WORKS_FIELDS: SiteContentField[] = [
  { key: "howItWorksTitle", label: "Section title" },
  { key: "stepPickCardTitle", label: "Step 1 title" },
  { key: "stepPickCardDescription", label: "Step 1 description", multiline: true },
  { key: "stepGiveSpeakTitle", label: "Step 2 title" },
  { key: "stepGiveSpeakDescription", label: "Step 2 description", multiline: true },
  { key: "stepScanQrTitle", label: "Step 3 title" },
  { key: "stepScanQrDescription", label: "Step 3 description", multiline: true },
  { key: "stepVisibleGrowthTitle", label: "Step 4 title" },
  { key: "stepVisibleGrowthDescription", label: "Step 4 description", multiline: true },
  { key: "stepMoreImpactTitle", label: "Step 5 title" },
  { key: "stepMoreImpactDescription", label: "Step 5 description", multiline: true }
];

export const HOME_AUDIENCE_FIELDS: SiteContentField[] = [
  { key: "companiesLabel", label: "Companies eyebrow" },
  { key: "companiesTitle", label: "Companies title" },
  { key: "companiesCopy", label: "Companies copy", multiline: true },
  { key: "managersLabel", label: "Managers eyebrow" },
  { key: "managersTitle", label: "Managers title" },
  { key: "managersCopy", label: "Managers copy", multiline: true },
  { key: "employeesLabel", label: "Employees eyebrow" },
  { key: "employeesTitle", label: "Employees title" },
  { key: "employeesCopy", label: "Employees copy", multiline: true }
];

export const HOME_RECOGNITION_CARDS_FIELDS: SiteContentField[] = [
  { key: "deckPreview", label: "Eyebrow" },
  { key: "deckPreviewTitle", label: "Section title" },
  { key: "deckPreviewCopy", label: "Section copy", multiline: true },
  { key: "previousCards", label: "Carousel previous label" },
  { key: "nextCards", label: "Carousel next label" },
  { key: "previewListening", label: "Card 1 title" },
  { key: "previewListeningCopy", label: "Card 1 description", multiline: true },
  { key: "previewRenewing", label: "Card 2 title" },
  { key: "previewRenewingCopy", label: "Card 2 description", multiline: true },
  { key: "previewGoalOriented", label: "Card 3 title" },
  { key: "previewGoalOrientedCopy", label: "Card 3 description", multiline: true },
  { key: "previewCaring", label: "Card 4 title" },
  { key: "previewCaringCopy", label: "Card 4 description", multiline: true }
];

export const HOME_FINAL_CTA_FIELDS: SiteContentField[] = [
  { key: "finalCtaBanner", label: "Banner eyebrow" },
  { key: "finalCtaTitle", label: "Headline" },
  { key: "finalCtaCopy", label: "Supporting paragraph", multiline: true },
  { key: "finalCtaButtonLabel", label: "CTA label (optional)" },
  { key: "finalCtaButtonHref", label: "CTA link (optional)" }
];

/** @deprecated Use section-specific exports */
export const HOME_CONTENT_FIELDS: SiteContentField[] = [
  ...HOME_HERO_FIELDS,
  ...HOME_AUDIENCE_FIELDS
];

export const HOME_CMS_SECTIONS: HomeContentSection[] = [
  {
    id: "hero",
    title: "Hero Section",
    description: "Main headline, supporting copy, trust labels, and scroll hint above the fold.",
    fields: HOME_HERO_FIELDS
  },
  {
    id: "marquee",
    title: "Animated Marquee / Trust Bar",
    description: "Scrolling text bar below the hero. Visual settings apply site-wide; text items are per language.",
    fields: HOME_MARQUEE_SETTING_FIELDS,
    enOnlySettings: true
  },
  {
    id: "value-proposition",
    title: "Pre-footer CTA Band",
    description: "Large photo CTA on the homepage before the footer. Controls the valueProp* headline, copy, and button.",
    fields: HOME_VALUE_PROPOSITION_FIELDS
  },
  {
    id: "how-it-works",
    title: "How It Works Section",
    description: "Five-step deck section explaining the GETH recognition flow.",
    fields: HOME_HOW_IT_WORKS_FIELDS
  },
  {
    id: "audience",
    title: "Audience Section",
    description: "Three audience cards for companies, managers, and employees.",
    fields: HOME_AUDIENCE_FIELDS
  },
  {
    id: "recognition-cards",
    title: "Recognition Cards Section",
    description: "Carousel preview of sample recognition cards.",
    fields: HOME_RECOGNITION_CARDS_FIELDS
  },
  {
    id: "final-cta",
    title: "Footer CTA Banner",
    description: "Footer strip call-to-action above the site footer on public pages. Uses finalCta* keys.",
    fields: HOME_FINAL_CTA_FIELDS
  }
];

export const ALL_HOME_CONTENT_FIELDS: SiteContentField[] = [
  ...HOME_HERO_FIELDS,
  ...HOME_VALUE_PROPOSITION_FIELDS,
  ...HOME_MARQUEE_SETTING_FIELDS,
  ...HOME_HOW_IT_WORKS_FIELDS,
  ...HOME_AUDIENCE_FIELDS,
  ...HOME_RECOGNITION_CARDS_FIELDS,
  ...HOME_FINAL_CTA_FIELDS,
  { key: "marqueeItems", label: "Marquee items (JSON)" },
  { key: "previewCommunication", label: "Card category: Communication" },
  { key: "previewCreativity", label: "Card category: Creativity" },
  { key: "previewCompetence", label: "Card category: Competence" },
  { key: "previewCollegiality", label: "Card category: Collegiality" }
];
