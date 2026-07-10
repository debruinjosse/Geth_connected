import Link from "next/link";

export function EmptyState({
  eyebrow = "Nothing yet",
  title,
  copy,
  actionLabel,
  actionHref
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="empty-state">
      <div className="eyebrow">{eyebrow}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
      {actionLabel && actionHref ? (
        <Link className="btn btn-secondary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
