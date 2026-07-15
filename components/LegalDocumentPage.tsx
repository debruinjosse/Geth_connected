import { ShieldCheck } from "lucide-react";
import type { LegalSection } from "@/lib/legal-content";

export function LegalDocumentPage({
  eyebrow,
  title,
  subtitle,
  effectiveDate,
  sections
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <section className="section-shell page-shell legal-page-shell">
      <div className="pageContainer legal-page-grid">
        <aside className="panel legal-sidebar">
          <div className="legal-sidebar-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <span className="quality-pill">{effectiveDate}</span>
        </aside>

        <article className="panel legal-document">
          {sections.map((section) => (
            <section className="legal-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.body.split("\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}
