import { CardsLibraryClient } from "@/components/CardsLibraryClient";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { getPublicCardLibrary } from "@/lib/card-library";

export default async function CardsPage() {
  const cards = await getPublicCardLibrary();

  return (
    <PublicSiteChrome ctaHref="/login" ctaLabel="Claim a card">
      <section className="cards-page">
        <div className="cards-hero">
          <div className="eyebrow">Public card library</div>
          <h1 className="section-title">Explore all 53 GETH recognition cards</h1>
          <p className="section-copy" style={{ maxWidth: 760 }}>
            Browse the live deck by category, search for card themes, and open the claim route for every active GETH Connected Card.
          </p>
        </div>
        <section className="section-shell" style={{ paddingTop: 8 }}>
          <CardsLibraryClient cards={cards} />
        </section>
      </section>
    </PublicSiteChrome>
  );
}
