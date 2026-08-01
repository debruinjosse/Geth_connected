import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordExperience } from "@/components/ForgotPasswordExperience";

export const maxDuration = 30;

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Enter your work email and choose a new password. No email link required."
    >
      <ForgotPasswordExperience />
    </AuthShell>
  );
}
