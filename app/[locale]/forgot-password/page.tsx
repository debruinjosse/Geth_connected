import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordExperience } from "@/components/ForgotPasswordExperience";

export const maxDuration = 30;

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <AuthShell
      locale={locale}
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Enter your work email and choose a new password. No email link required."
    >
      <ForgotPasswordExperience />
    </AuthShell>
  );
}
