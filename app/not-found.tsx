import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import messages from "@/messages/nl.json";

// This is the root not-found, so it renders outside `app/[locale]` and has no
// request locale to read. It uses the default-locale copy directly.
const copy = messages.notFound;

export default function NotFound() {
  return (
    <main className="claim-empty">
      <section className="panel claim-empty-card">
        <BrandLogo dark />
        <div className="eyebrow" style={{ marginTop: 24 }}>
          {copy.eyebrow}
        </div>
        <h1 style={{ margin: "10px 0 14px", fontSize: 48 }}>{copy.title}</h1>
        <p className="section-copy">{copy.copy}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
          <Link className="btn btn-dark" href="/">
            {copy.backHome} <ArrowRight size={16} />
          </Link>
          <Link className="btn btn-secondary" href="/cards">
            {copy.browseCards}
          </Link>
        </div>
      </section>
    </main>
  );
}
