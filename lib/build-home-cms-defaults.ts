import { DEFAULT_MARQUEE_SETTINGS } from "@/lib/marquee-config";
import { getDefaultMarqueeItemsSerialized } from "@/lib/home-cms-defaults";
import { ALL_HOME_CONTENT_FIELDS } from "@/lib/site-content-fields";

type Translator = (key: string) => string;

export async function buildHomeCmsDefaults(
  locale: "en" | "nl",
  home: Translator,
  landing: Translator,
  footer: Translator
) {
  const defaults: Record<string, string> = {};

  for (const field of ALL_HOME_CONTENT_FIELDS) {
    if (field.key === "marqueeItems") continue;
    if (field.key.startsWith("marquee") && field.key !== "marqueeItems") {
      defaults[field.key] = DEFAULT_MARQUEE_SETTINGS[field.key] ?? "";
      continue;
    }
    defaults[field.key] = home(field.key);
  }

  defaults.howItWorksTitle = landing("howItWorks.title");
  defaults.stepPickCardTitle = landing("howItWorks.steps.pickCard.title");
  defaults.stepPickCardDescription = landing("howItWorks.steps.pickCard.description");
  defaults.stepGiveSpeakTitle = landing("howItWorks.steps.giveSpeak.title");
  defaults.stepGiveSpeakDescription = landing("howItWorks.steps.giveSpeak.description");
  defaults.stepScanQrTitle = landing("howItWorks.steps.scanQr.title");
  defaults.stepScanQrDescription = landing("howItWorks.steps.scanQr.description");
  defaults.stepVisibleGrowthTitle = landing("howItWorks.steps.visibleGrowth.title");
  defaults.stepVisibleGrowthDescription = landing("howItWorks.steps.visibleGrowth.description");
  defaults.stepMoreImpactTitle = landing("howItWorks.steps.moreImpact.title");
  defaults.stepMoreImpactDescription = landing("howItWorks.steps.moreImpact.description");

  defaults.finalCtaBanner = footer("banner");
  defaults.finalCtaTitle = footer("title");
  defaults.finalCtaCopy = footer("copy");
  defaults.finalCtaButtonLabel = home("finalCtaButtonLabel");
  defaults.finalCtaButtonHref = home("finalCtaButtonHref");

  defaults.marqueeItems = getDefaultMarqueeItemsSerialized(locale);

  return defaults;
}
