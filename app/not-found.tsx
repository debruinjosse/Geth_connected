import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { GoldenLeaves } from "@/components/GoldenLeaves";

export default function NotFound() {
  return (
    <main className="claim-empty">
      <section className="panel claim-empty-card">
        <BrandLogo dark />
        <div className="eyebrow" style={{ marginTop: 24 }}>
          Not found
        </div>
        <h1 style={{ margin: "10px 0 14px", fontSize: 48 }}>That page doesn&apos;t exist.</h1>
        <p className="section-copy">Let&apos;s get you back to the GETH experience that does.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
          <Link className="btn btn-dark" href="/">
            Back home <ArrowRight size={16} />
          </Link>
          <Link className="btn btn-secondary" href="/cards">
            Browse cards
          </Link>
        </div>
        <GoldenLeaves className="card-leaves-bottom" />
      </section>
    </main>
  );
}
