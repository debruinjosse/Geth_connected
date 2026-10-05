export function Step({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <article className="gt-step">
      <span className="gt-step-number" aria-hidden="true">{String(index).padStart(2, "0")}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
