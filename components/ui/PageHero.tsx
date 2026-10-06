import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cx } from "@/components/ui/cx";

/** Opening band of an inner page: eyebrow, light headline (optional gold second line), lead, actions. */
export function PageHero({
  eyebrow,
  title,
  accent,
  lead,
  actions,
  centered = false,
  decoration,
  titleId = "lp-page-title"
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
  decoration?: ReactNode;
  titleId?: string;
}) {
  return (
    <section className={cx("lp-pagehero", centered && "lp-centered")} aria-labelledby={titleId}>
      {decoration}
      <Container>
        <div className="lp-pagehero-in">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 id={titleId}>
            {title}
            {accent ? (
              <>
                {" "}
                <span className="lp-accent">{accent}</span>
              </>
            ) : null}
          </h1>
          {lead ? <p className="lp-lead">{lead}</p> : null}
          {actions ? <div className="lp-pagehero-actions">{actions}</div> : null}
        </div>
      </Container>
    </section>
  );
}
