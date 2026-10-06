import type { LegalSection } from "@/lib/legal-content";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Pill } from "@/components/ui/Pill";

function slugify(value: string, index: number) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `s${index + 1}-${slug}`.slice(0, 60);
}

/** Policy / terms layout: sticky title + table of contents, readable single-column document. */
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
    <section className="lp-section-sm" style={{ paddingTop: 88, paddingBottom: 120 }}>
      <Container>
        <div className="lp-legal">
          <aside className="lp-legal-side">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 style={{ margin: "16px 0 16px", fontSize: "clamp(2rem,3.2vw,2.6rem)" }}>{title}</h1>
            <p className="lp-lead" style={{ fontSize: "1.0625rem" }}>
              {subtitle}
            </p>
            <Pill tone="gold">{effectiveDate}</Pill>
            <ol className="lp-toc">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#${slugify(section.title, index)}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="lp-legal-doc">
            {sections.map((section, index) => (
              <section id={slugify(section.title, index)} key={section.title}>
                <h2>{section.title}</h2>
                {section.body.split("\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </Container>
    </section>
  );
}
