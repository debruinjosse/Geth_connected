import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordExperience } from "@/components/ResetPasswordExperience";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <AuthShell
      locale={locale}
      eyebrow="Secure account recovery"
      title="Reset your GETH password"
      subtitle="Use the secure email link to set a fresh password and return to your workspace."
    >
      <ResetPasswordExperience />
    </AuthShell>
  );
}
