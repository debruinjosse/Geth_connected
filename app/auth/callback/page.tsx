import { AuthShell } from "@/components/AuthShell";
import { AuthCallbackStatus } from "@/components/AuthCallbackStatus";

type CallbackSearchParams = {
  invite?: string;
  next?: string;
};

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<CallbackSearchParams>;
}) {
  const { invite, next } = await searchParams;

  return (
    <AuthShell
      eyebrow="Secure sign-in"
      title="Finishing your sign-in"
      subtitle="We are connecting your magic link, profile, and workspace access right now."
    >
      <AuthCallbackStatus inviteToken={invite} targetPath={next} />
    </AuthShell>
  );
}
