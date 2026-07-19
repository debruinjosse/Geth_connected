import type { Metadata } from "next";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

export const metadata: Metadata = {
  title: "GETH Vision, Mission & Meaning",
  description: "The vision, mission, and meaning behind GETH."
};

export default async function VisionMissionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell vision-page">
        <div className="pageContainer vision-page-inner">
          <div className="vision-document">
            <div className="eyebrow">GETH</div>
            <h1>GETH Vision, Mission & Meaning</h1>

            <article>
              <h2>Vision</h2>
              <p>
                GETH envisions a world of work where recognition is visible, measurable, and embedded in everyday
                interactions. A world where colleagues recognise each other in the moment, personally and tangibly,
                enabling people, teams, and culture to grow stronger together.
              </p>
            </article>

            <article>
              <h2>Mission</h2>
              <p>
                GETH helps organisations make recognition visible and measurable. Through <strong>53 connected cards</strong>{" "}
                across four pillars, colleagues recognise each other personally and in the moment. In doing so, GETH
                strengthens connection, engagement, and performance in everyday work.
              </p>
            </article>

            <article>
              <h2>The Meaning of GETH</h2>
              <p>
                GETH stands for <strong>Great Employee To Have</strong> and <strong>Great Environment To Have</strong>.
              </p>
              <p>
                We believe organisations thrive when people feel seen, valued, and recognised for the contributions
                they make every day.
              </p>
            </article>
          </div>
        </div>
      </section>
    </PublicSiteChrome>
  );
}
