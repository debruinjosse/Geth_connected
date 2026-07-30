import { ClaimCardRoute } from "../../claim-card/[slug]/ClaimCardRoute";

export default async function GiveCardPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  return <ClaimCardRoute locale={locale} slug={slug} initialFlowMode="give" />;
}
