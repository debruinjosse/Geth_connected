import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordExperience } from "@/components/ResetPasswordExperience";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Secure account recovery"
      title="Reset your GETH password"
      subtitle="Use the secure email link to set a fresh password and return to your workspace."
    >
      <ResetPasswordExperience />
    </AuthShell>
  );
}
