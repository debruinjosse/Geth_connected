import { AuthShell } from "@/components/AuthShell";
import { AuthExperience } from "@/components/AuthExperience";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ invite?: string; error?: string }>;
}) {
  const { invite, error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Employee access"
      title="Log in to GETH"
      subtitle="Claim cards, follow your growth, and keep recognition visible across your team."
    >
      <AuthExperience mode="login" inviteToken={invite} authError={error} />
    </AuthShell>
  );
}
