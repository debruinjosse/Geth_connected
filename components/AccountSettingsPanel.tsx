import { Camera, KeyRound, Save, UploadCloud } from "lucide-react";
import { sendPasswordResetFromSettingsAction, updateOwnProfileNameAction, updateOwnProfilePhotoAction } from "@/app/actions/accountSettings";

function getSettingsMessage(code?: string) {
  switch (code) {
    case "profile-updated":
      return { tone: "success", copy: "Your display name was updated." };
    case "profile-photo-updated":
      return { tone: "success", copy: "Your profile photo was updated." };
    case "reset-email-sent":
      return { tone: "success", copy: "Password reset email sent. Open the GETH button in your inbox." };
    case "first-name-required":
      return { tone: "error", copy: "First name is required." };
    case "profile-photo-required":
      return { tone: "error", copy: "Choose a profile photo before uploading." };
    case "profile-photo-invalid":
      return { tone: "error", copy: "Use a JPG, PNG, WEBP, or GIF image." };
    case "profile-photo-too-large":
      return { tone: "error", copy: "That image is larger than 50 MB. Use an HD photo under 50 MB." };
    case "profile-photo-failed":
      return { tone: "error", copy: "We could not upload that photo. Check the Supabase profile-photos bucket and service role key." };
    case "profile-update-failed":
      return { tone: "error", copy: "We could not update your name. Make sure migration 008 is applied." };
    case "reset-email-failed":
      return { tone: "error", copy: "We could not send the reset email. Check Supabase SMTP/email settings." };
    default:
      return null;
  }
}

export function AccountSettingsPanel({
  email,
  firstName,
  lastName,
  profileImageUrl,
  returnTo,
  statusCode
}: {
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  returnTo: string;
  statusCode?: string;
}) {
  const message = getSettingsMessage(statusCode);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GU";

  return (
    <article className="panel dashboard-panel account-settings-panel">
      <div className="panel-top">
        <div>
          <h2>Account settings</h2>
          <p>Update your display name or send yourself a secure password reset email.</p>
        </div>
      </div>

      {message ? <p className={`settings-feedback ${message.tone}`}>{message.copy}</p> : null}

      <form action={updateOwnProfilePhotoAction} className="settings-photo-form" encType="multipart/form-data">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="settings-photo-preview">
          <div className="profile-photo-large">
            {profileImageUrl ? <img src={profileImageUrl} alt={`${firstName || "Your"} profile`} /> : <span>{initials}</span>}
          </div>
          <div>
            <strong>Profile photo</strong>
            <p>Upload an HD JPG, PNG, WEBP, or GIF up to 50 MB. This photo appears in your dashboard and claim-card people picker.</p>
          </div>
        </div>
        <label className="profile-photo-upload">
          <Camera size={16} />
          <span>Choose photo</span>
          <input type="file" name="profilePhoto" accept="image/jpeg,image/png,image/webp,image/gif" required />
        </label>
        <div className="settings-action-row">
          <button className="btn btn-secondary" type="submit">
            <UploadCloud size={16} /> Upload photo
          </button>
        </div>
      </form>

      <form action={updateOwnProfileNameAction} className="settings-form">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="form-grid">
          <label>
            First name
            <input className="input" name="firstName" defaultValue={firstName} required />
          </label>
          <label>
            Last name
            <input className="input" name="lastName" defaultValue={lastName} />
          </label>
        </div>
        <div className="settings-action-row">
          <button className="btn btn-primary" type="submit">
            <Save size={16} /> Save name
          </button>
        </div>
      </form>

      <form action={sendPasswordResetFromSettingsAction} className="settings-reset-form">
        <input type="hidden" name="returnTo" value={returnTo} />
        <div>
          <strong>Password reset</strong>
          <p>We will send a reset link to {email}.</p>
        </div>
        <button className="btn btn-secondary" type="submit">
          <KeyRound size={16} /> Send reset email
        </button>
      </form>
    </article>
  );
}
