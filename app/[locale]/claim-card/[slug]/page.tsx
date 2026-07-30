import { ClaimCardRoute } from "./ClaimCardRoute";

export default async function ClaimCardPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { locale, slug } = await params;
  const { mode } = await searchParams;
  const initialFlowMode = mode === "give" ? "give" : "claim";

  return <ClaimCardRoute locale={locale} slug={slug} initialFlowMode={initialFlowMode} />;
}
