import Link from "next/link";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

const resources = [
  ["Documentation", "Implementation guidance, onboarding notes, and setup walkthroughs."],
  ["API", "How connected-card routes, recognitions, and dashboards can be wired to backend systems."],
  ["Blog", "Stories, launch notes, and culture design insights from the GETH team."],
  ["Support", "Contact help, submit rollout questions, and review security resources."],
  ["Final review invite", "Download the Sunday project review calendar invite for launch-readiness alignment."]
];

export default function ResourcesPage() {
  return (
    <PublicSiteChrome>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">Resources</div>
          <h1 className="section-title">Everything your rollout team needs</h1>
          <p className="section-copy">A polished placeholder resources hub for documentation, API references, thought leadership, and support.</p>
        </div>
        <div className="audience-grid">
          {resources.map(([title, copy]) => (
            <article className="audience-card" key={title}>
              <div className="eyebrow">{title}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link href={title === "Final review invite" ? "/calendar/final-review" : "/book-demo"} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                {title === "Final review invite" ? "Download calendar invite" : `Open ${title.toLowerCase()}`}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteChrome>
  );
}
