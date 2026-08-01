import { BrandMarkIcon } from "@/components/BrandLogo";
import { HowItWorksStepCard } from "@/components/sections/HowItWorksStepCard";
import { Heart, MessagesSquare, QrCode, TrendingUp, User, UsersRound } from "lucide-react";

function CardStackIcon() {
  return (
    <div className="deck-card-stack-icon" aria-hidden="true">
      <span className="deck-card-stack-icon__back" />
      <span className="deck-card-stack-icon__middle" />
      <span className="deck-card-stack-icon__front">
        <BrandMarkIcon alt="" size={34} />
      </span>
    </div>
  );
}

function GiveSpeakIcon() {
  return (
    <div className="deck-combined-icon" aria-hidden="true">
      <User className="deck-combined-icon__left" />
      <User className="deck-combined-icon__right" />
      <MessagesSquare className="deck-combined-icon__center" />
    </div>
  );
}

function ScanQrIcon() {
  return (
    <div className="deck-phone-icon" aria-hidden="true">
      <span className="deck-phone-icon__speaker" />
      <QrCode />
      <span className="deck-phone-icon__home" />
    </div>
  );
}

function VisibleGrowthIcon() {
  return (
    <div className="deck-growth-icon" aria-hidden="true">
      <User />
      <TrendingUp />
    </div>
  );
}

function MoreImpactIcon() {
  return (
    <div className="deck-impact-icon" aria-hidden="true">
      <Heart className="deck-impact-icon__heart" />
      <UsersRound className="deck-impact-icon__people" />
    </div>
  );
}

export type HowItWorksStepContent = {
  title: string;
  description: string;
};

export type HowItWorksContent = {
  title: string;
  steps: {
    pickCard: HowItWorksStepContent;
    giveSpeak: HowItWorksStepContent;
    scanQr: HowItWorksStepContent;
    visibleGrowth: HowItWorksStepContent;
    moreImpact: HowItWorksStepContent;
  };
};

export function HowItWorksDeckSection({ content }: { content: HowItWorksContent }) {
  const steps = [
    { key: "pickCard", icon: <CardStackIcon /> },
    { key: "giveSpeak", icon: <GiveSpeakIcon /> },
    { key: "scanQr", icon: <ScanQrIcon /> },
    { key: "visibleGrowth", icon: <VisibleGrowthIcon /> },
    { key: "moreImpact", icon: <MoreImpactIcon /> }
  ] as const;

  return (
    <section className="deck-how-it-works" id="how-it-works" aria-labelledby="deck-how-it-works-title">
      <div className="deck-how-it-works__inner">
        <header className="deck-how-it-works__header">
          <h2 id="deck-how-it-works-title">{content.title}</h2>
        </header>

        <div className="how-it-works-deck">
          {steps.map((step, index) => (
            <article className="deck-how-it-works__step" key={step.key}>
              <div className="deck-how-it-works__meta">
                <div className="deck-how-it-works__number">{index + 1}</div>
                <div className="deck-how-it-works__icon">{step.icon}</div>
              </div>
              <div className="deck-how-it-works__content">
                <h3>{content.steps[step.key].title}</h3>
                <p>{content.steps[step.key].description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="how-it-works-mobile-cards">
          {steps.map((step, index) => (
            <HowItWorksStepCard
              key={`card-${step.key}`}
              number={index + 1}
              title={content.steps[step.key].title}
              description={content.steps[step.key].description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
