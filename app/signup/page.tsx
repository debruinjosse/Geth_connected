import { AuthShell } from "@/components/AuthShell";
import { AuthExperience } from "@/components/AuthExperience";

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ invite?: string; error?: string }>;
}) {
  const { invite, error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Company onboarding"
      title="Create your GETH account"
      subtitle="Set up your workspace, invite your team, and start turning appreciation into culture insight."
    >
      <AuthExperience mode="signup" inviteToken={invite} authError={error} />
    </AuthShell>
  );
}
