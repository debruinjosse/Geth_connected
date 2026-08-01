type HowItWorksStepCardProps = {
  number: number;
  title: string;
  description: string;
};

export function HowItWorksStepCard({ number, title, description }: HowItWorksStepCardProps) {
  return (
    <article className="how-it-works-step-card">
      <div className="how-it-works-step-card__badge" aria-hidden="true">{number}</div>
      <div className="how-it-works-step-card__body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
