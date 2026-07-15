"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseBrowserConfig, type DemoRole } from "@/lib/demo-session";

const signupRoles: Array<{ value: DemoRole; label: string }> = [
  { value: "employee", label: "Employee / invited user" },
  { value: "manager", label: "Manager / invited leader" },
  { value: "company_admin", label: "Company admin / new company" }
];

const roleShortcuts: Array<{ value: DemoRole; label: string }> = [
  { value: "employee", label: "Join as employee" },
  { value: "manager", label: "Join as manager" },
  { value: "company_admin", label: "Register company" }
];

const loginRoles = [...roleShortcuts, { value: "super_admin" as DemoRole, label: "Owner login" }];

function getSelectableAuthRole(role: DemoRole) {
  return loginRoles.some((option) => option.value === role) ? role : "employee";
}

export function AuthExperience({
  mode,
  inviteToken,
  authError,
  initialRole = "employee",
  targetPath
}: {
  mode: "login" | "signup";
  inviteToken?: string;
  authError?: string;
  initialRole?: DemoRole;
  targetPath?: string;
}) {
  const locale = useLocale();
  const [submitBusy, setSubmitBusy] = useState(false);
  const [magicLinkBusy, setMagicLinkBusy] = useState(false);
  const [passwordResetBusy, setPasswordResetBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<DemoRole>(initialRole);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: ""
  });

  const supabaseReady = useMemo(() => hasSupabaseBrowserConfig(), []);
  const busy = submitBusy || magicLinkBusy || passwordResetBusy;
  const selectedSignupRole = signupRoles.some((role) => role.value === selectedRole) ? selectedRole : "employee";

  function getLocalizedPublicPath(path: string) {
    if (!path.startsWith("/") || path.startsWith("/auth")) {
      return path;
    }

    if (path === "/") {
      return `/${locale}`;
    }

    return `/${locale}${path}`;
  }

  function getAuthModeHref(nextMode: "login" | "signup", role = selectedRole, nextOverride?: string) {
    const params = new URLSearchParams();
    const nextRole = nextMode === "signup" && role === "super_admin" ? "company_admin" : role;
    if (nextRole) {
      params.set("role", nextRole);
    }
    if (inviteToken) {
      params.set("invite", inviteToken);
    }
    const safeNext = getSafeTargetPath(nextOverride);
    if (safeNext) {
      params.set("next", safeNext);
    }

    const query = params.toString();
    return `/${locale}/${nextMode}${query ? `?${query}` : ""}`;
  }

  function getSafeTargetPath(path?: string) {
    if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/api") || path.startsWith("/auth")) {
      return "";
    }

    return path;
  }

  function resolvePostAuthRedirect(actualRedirect: string) {
    const safeTarget = getSafeTargetPath(targetPath);
    if (!safeTarget) return actualRedirect;

    return safeTarget === actualRedirect || safeTarget.startsWith(`${actualRedirect}/`) ? safeTarget : actualRedirect;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hasAuthSession = hashParams.has("access_token") && hashParams.has("refresh_token");
    if (!hasAuthSession) return;

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (inviteToken) {
      callbackUrl.searchParams.set("invite", inviteToken);
    }
    const safeTargetPath = getSafeTargetPath(targetPath);
    if (safeTargetPath) {
      callbackUrl.searchParams.set("next", safeTargetPath);
    }
    callbackUrl.hash = window.location.hash.replace(/^#/, "");
    window.location.replace(callbackUrl.toString());
  }, [inviteToken, targetPath]);

  useEffect(() => {
    if (typeof window === "undefined" || authError !== "missing_profile") return;
    setStatusTone("info");
    setStatus("Repairing your GETH profile and opening your dashboard...");
    window.location.replace("/auth/repair-profile");
  }, [authError]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function finalizeAuthenticatedSession() {
    const response = await fetch("/auth/callback/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inviteToken: inviteToken ?? null, targetPath: getSafeTargetPath(targetPath) || null })
    });
    const payload = (await response.json().catch(() => ({}))) as { redirectTo?: string };

    if (!response.ok || !payload.redirectTo) {
      throw new Error("Your account was authenticated, but profile setup failed.");
    }

    window.location.assign(resolvePostAuthRedirect(payload.redirectTo));
  }

  function repairProfileAndOpenDashboard() {
    window.location.assign("/auth/repair-profile");
  }

  function getAuthErrorCopy(error?: string) {
    switch (error) {
      case "auth_callback_failed":
        return "That email link did not complete sign-in. Make sure the Supabase email redirect URL points to /auth/callback for this app.";
      case "profile_bootstrap_failed":
        return "Your login worked, but your GETH profile could not be created or loaded. Check that the profiles and companies tables exist and that the service role key is present.";
      case "missing_profile":
        return "You are signed in, but your GETH profile is missing. Use the repair button below, or ask a company admin to invite you.";
      case "admin_required":
        return "Admin access requires a super admin account. You have been signed out of the previous role; log in with the super admin credentials.";
      case "password_updated":
        return "Your password was updated. Log in with your new password.";
      default:
        return "";
    }
  }

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    if (error && typeof error === "object") {
      const possibleMessage =
        "message" in error && typeof error.message === "string"
          ? error.message
          : "error_description" in error && typeof error.error_description === "string"
            ? error.error_description
            : "error" in error && typeof error.error === "string"
              ? error.error
              : "";

      if (possibleMessage.trim()) {
        return possibleMessage;
      }
    }

    return fallback;
  }

  function getFriendlyAuthError(error: unknown) {
    const message = getErrorMessage(error, "We couldn't start that sign-in flow.");
    const lower = message.toLowerCase();

    if (lower.includes("invalid login credentials")) {
      return "Those credentials did not match. If this email already exists, use Reset password to create a new password, then log in again.";
    }

    if (lower.includes("email not confirmed")) {
      return "Please confirm your email first, then log in with your password.";
    }

    return message;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitBusy(true);
    setStatus("");
    setStatusTone("info");

    try {
      if (supabaseReady && form.email) {
        const supabase = createSupabaseBrowserClient();
        const authRole = mode === "signup" ? selectedSignupRole : "employee";

        if (!form.password || form.password.length < 6) {
          throw new Error("Enter a password with at least 6 characters.");
        }

        if (mode === "signup") {
          const signupResponse = await fetch("/auth/password-signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: form.email,
              password: form.password,
              fullName: form.name,
              company: form.company,
              role: authRole,
              inviteToken: inviteToken ?? null
            })
          });
          const signupPayload = (await signupResponse.json().catch(() => ({}))) as { error?: string; redirectTo?: string };

          if (!signupResponse.ok || !signupPayload.redirectTo) {
            throw new Error(signupPayload.error || "We could not create this account.");
          }

          const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password
          });

          if (error) throw error;

          window.location.assign(resolvePostAuthRedirect(signupPayload.redirectTo));
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });

        if (error) throw error;

        await finalizeAuthenticatedSession();
        return;
      }

      throw new Error("Supabase is not configured yet. Add the Supabase environment variables before using real login.");
    } catch (error) {
      setStatusTone("error");
      setStatus(getFriendlyAuthError(error));
    } finally {
      setSubmitBusy(false);
    }
  }

  async function sendPasswordReset() {
    setPasswordResetBusy(true);
    setStatus("");
    setStatusTone("info");

    try {
      if (!supabaseReady || !form.email) {
        throw new Error("Enter your work email first.");
      }

      const redirectTo = new URL("/auth/callback", window.location.origin);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: redirectTo.toString()
      });

      if (error) throw error;

      setStatusTone("success");
      setStatus("Password reset email sent. Open the GETH button in your inbox to set a new password.");
    } catch (error) {
      setStatusTone("error");
      setStatus(getErrorMessage(error, "We couldn't send that reset email. Check your email address and Supabase email settings."));
    } finally {
      setPasswordResetBusy(false);
    }
  }

  async function sendMagicLink() {
    setMagicLinkBusy(true);
    setStatus("");
    setStatusTone("info");

    try {
      if (!supabaseReady || !form.email) {
        throw new Error("Enter your work email first.");
      }

      const supabase = createSupabaseBrowserClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      const authRole = mode === "signup" ? selectedSignupRole : "employee";
      if (inviteToken) {
        redirectTo.searchParams.set("invite", inviteToken);
      }
      const safeTargetPath = getSafeTargetPath(targetPath);
      if (safeTargetPath) {
        redirectTo.searchParams.set("next", safeTargetPath);
      }

      const { error } =
        mode === "signup"
          ? await supabase.auth.signInWithOtp({
              email: form.email,
              options: {
                emailRedirectTo: redirectTo.toString(),
                shouldCreateUser: true,
                data: {
                  full_name: form.name || "New User",
                  company: form.company || "GETH Workspace",
                  role: authRole
                }
              }
            })
          : await supabase.auth.signInWithOtp({
              email: form.email,
              options: {
                emailRedirectTo: redirectTo.toString(),
                shouldCreateUser: false
              }
            });

      if (error) throw error;

      setStatusTone("success");
      setStatus(
        mode === "signup"
          ? `Mail sent successfully to ${form.email}. Open the GETH button in your inbox to finish setup.`
          : `Mail sent successfully to ${form.email}. Open the GETH button in your inbox to continue.`
      );
    } catch (error) {
      setStatusTone("error");
      setStatus(getErrorMessage(error, "We couldn't send that magic link. Check Supabase Auth email settings."));
    } finally {
      setMagicLinkBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>{mode === "signup" ? "Create account" : "Log in"}</h2>
      <p className="section-copy">
        {mode === "signup"
          ? "Create a company admin account for a new company, or create a regular user account for an invited team member."
          : "Use your work email and password to access your workspace."}
      </p>
      {mode === "login" ? (
        <Link className={`auth-owner-shortcut ${selectedRole === "super_admin" ? "active" : ""}`} href={getAuthModeHref("login", "super_admin", "/admin")}>
          <span>Owner / super admin login</span>
          <ArrowRight size={15} />
        </Link>
      ) : null}
      {mode === "signup" ? (
        <Link className="btn btn-secondary btn-full auth-switch-cta" href={getAuthModeHref("login")}>
          Already have an account? Log in <ArrowRight size={16} />
        </Link>
      ) : null}
      <div className="auth-role-shortcuts" aria-label={mode === "signup" ? "Choose signup role" : "Choose login role"}>
        <p>Choose how you want to enter GETH.</p>
        <div className="auth-role-shortcut-list">
          {roleShortcuts.map((role) => (
            <Link
              className={`auth-role-shortcut ${selectedRole === role.value ? "active" : ""}`}
              href={getAuthModeHref(mode, role.value)}
              key={role.value}
              aria-current={selectedRole === role.value ? "page" : undefined}
            >
              {role.label}
            </Link>
          ))}
        </div>
        {inviteToken ? <span className="auth-role-shortcuts-note">Invitation details decide your final company, team, and role.</span> : null}
      </div>
      {inviteToken ? <p className="auth-status invite-status">This sign-in will apply your invitation after the magic link is opened.</p> : null}
      {getAuthErrorCopy(authError) ? <p className="auth-status auth-error-status">{getAuthErrorCopy(authError)}</p> : null}
      {authError === "missing_profile" ? (
        <button className="btn btn-primary btn-full auth-switch-cta" type="button" onClick={repairProfileAndOpenDashboard} disabled={busy}>
          Repair profile and open dashboard <ArrowRight size={16} />
        </button>
      ) : null}

      <form onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <>
            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <input id="name" className="input" placeholder="Sarah van den Berg" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </div>
            <div className="form-field">
              <label htmlFor="company">Company</label>
              <input id="company" className="input" placeholder="ABC Company" value={form.company} onChange={(event) => updateField("company", event.target.value)} required />
            </div>
          </>
        ) : null}
        <div className="form-field">
          <label htmlFor="auth-email">Work email</label>
          <input id="auth-email" className="input" type="email" placeholder="sarah@company.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="auth-password">Password</label>
          <div className="password-input-wrap">
            <input id="auth-password" className="input" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={6} />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        {mode === "signup" ? (
          <div className="form-field">
            <label htmlFor="role">Account type</label>
            <select id="role" className="input" value={selectedSignupRole} onChange={(event) => setSelectedRole(event.target.value as DemoRole)}>
              {signupRoles.map((role) => (
                <option value={role.value} key={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button className={`btn ${mode === "signup" ? "btn-primary" : "btn-dark"} btn-full`} disabled={busy} type="submit">
          {submitBusy ? "Working..." : supabaseReady ? (mode === "signup" ? "Create account" : "Log in") : "Continue in demo mode"} <ArrowRight size={16} />
        </button>
      </form>

      {supabaseReady ? (
        <button className="btn btn-secondary btn-full auth-demo-cta" type="button" onClick={sendMagicLink} disabled={busy}>
          {magicLinkBusy ? "Sending magic link..." : mode === "signup" ? "Send magic link instead" : "Email me a magic link instead"}
        </button>
      ) : null}

      {supabaseReady && mode === "login" ? (
        <button className="btn btn-secondary btn-full auth-demo-cta" type="button" onClick={sendPasswordReset} disabled={busy}>
          {passwordResetBusy ? "Sending reset email..." : "Reset password"}
        </button>
      ) : null}

      {status ? (
        <p className={`auth-status auth-status-${statusTone}`}>
          <CheckCircle2 size={16} />
          {status}
        </p>
      ) : null}

      <div className={`auth-links ${mode === "login" ? "auth-links-single" : ""}`}>
        {mode === "signup" ? <Link href={getAuthModeHref("login")}>Already have an account?</Link> : null}
        <Link href={getLocalizedPublicPath("/")}>Back to site</Link>
      </div>
    </div>
  );
}
