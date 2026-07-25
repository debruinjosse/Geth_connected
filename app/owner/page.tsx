import { redirect } from "next/navigation";

export default async function OwnerEntryPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  redirect(`/en/owner${error ? `?error=${encodeURIComponent(error)}` : ""}`);
}
