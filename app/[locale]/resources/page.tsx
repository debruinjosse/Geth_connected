import Link from "next/link";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

const resources = [
  ["API", "How connected-card routes, recognitions, and dashboards can be wired to backend systems."],
  ["Support", "Contact help, submit rollout questions, and review security resources."]
];

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">Resources</div>
          <h1 className="section-title">Everything your rollout team needs</h1>
          <p className="section-copy">A focused resources hub for API references and support.</p>
        </div>
        <div className="audience-grid">
          {resources.map(([title, copy]) => (
            <article className="audience-card" key={title}>
              <div className="eyebrow">{title}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link href={`/${locale}/book-demo`} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                {`Open ${title.toLowerCase()}`}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteChrome>
  );
}
