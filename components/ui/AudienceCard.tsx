export function AudienceCard({
  title,
  description,
  linkLabel,
  linkHref
}: {
  title: string;
  description: string;
  linkLabel?: string;
  linkHref?: string;
}) {
  return (
    <article className="gt-audience-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {linkLabel && linkHref ? (
        <a className="gt-text-link" href={linkHref}>
          {linkLabel}
        </a>
      ) : null}
    </article>
  );
}
