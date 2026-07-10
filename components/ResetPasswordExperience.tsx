"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordExperience() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function finalizeAuthenticatedSession() {
    const response = await fetch("/auth/callback/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteToken: null })
    });
    const payload = (await response.json().catch(() => ({}))) as { redirectTo?: string };

    if (!response.ok || !payload.redirectTo) {
      window.location.assign("/login?error=password_updated");
      return;
    }

    window.location.assign(payload.redirectTo);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      if (password.length < 6) {
        throw new Error("Enter a password with at least 6 characters.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setStatus("Password updated. Redirecting you to your workspace...");
      await finalizeAuthenticatedSession();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "We couldn't update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Set new password</h2>
      <p className="section-copy">Choose a new password for your GETH account, then continue to your workspace.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="new-password">New password</label>
          <div className="password-input-wrap">
            <input
              id="new-password"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button className="btn btn-dark btn-full" disabled={busy} type="submit">
          {busy ? "Updating..." : "Update password"} <ArrowRight size={16} />
        </button>
      </form>

      {status ? (
        <p className="auth-status">
          <CheckCircle2 size={16} />
          {status}
        </p>
      ) : null}

      <div className="auth-links">
        <Link href="/login">Back to login</Link>
        <Link href="/">Back to site</Link>
      </div>
    </div>
  );
}
