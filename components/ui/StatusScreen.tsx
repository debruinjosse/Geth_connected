/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

/** Full-page centred message (errors, 404, loading) in the GETH design system. */
export function StatusScreen({
  eyebrow,
  title,
  children,
  actions,
  note,
  busy
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  note?: ReactNode;
  busy?: boolean;
}) {
  return (
    <main className="lp lp-status" aria-busy={busy || undefined}>
      <section className="lp-card lp-card-lg lp-status-card">
        <span className="lp-brand lp-status-brand">
          <img src="/landing/geth-crest.svg" alt="" />
          <b>
            GETH<sup>®</sup>
          </b>
        </span>
        {eyebrow ? <span className="lp-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {children ? <p className="lp-lead">{children}</p> : null}
        {note ? <small className="lp-hint">{note}</small> : null}
        {busy ? (
          <div className="lp-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        {actions ? <div className="lp-status-actions">{actions}</div> : null}
      </section>
    </main>
  );
}
