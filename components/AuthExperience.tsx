"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { requestMagicLinkEmail } from "@/app/actions/magicLink";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseBrowserConfig, type DemoRole } from "@/lib/demo-session";
import type { InviteSignupPrefill } from "@/lib/auth/invite-signup-prefill";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Fields";
import { PasswordInput } from "@/components/ui/PasswordInput";

// Labels are translation keys under the `authForm` namespace.
const signupRoles: Array<{ value: DemoRole; labelKey: string }> = [
  { value: "employee", labelKey: "roleEmployee" },
  { value: "manager", labelKey: "roleManager" },
  { value: "company_admin", labelKey: "roleCompanyAdmin" }
];

const roleShortcuts: Array<{ value: DemoRole; labelKey: string }> = [
  { value: "employee", labelKey: "joinEmployee" },
  { value: "manager", labelKey: "joinManager" },
  { value: "company_admin", labelKey: "joinCompany" }
];

function getRoleTargetPath(role: DemoRole) {
  if (role === "manager") return "/manager";
  if (role === "company_admin") return "/company";
  if (role === "super_admin") return "/admin";
  return "/employee";
}

export function AuthExperience({
  mode,
  inviteToken,
  invitePrefill,
  authError,
  initialRole = "employee",
  targetPath,
  roleChoiceOnly = false
}: {
  mode: "login" | "signup";
  inviteToken?: string;
  invitePrefill?: InviteSignupPrefill;
  authError?: string;
  initialRole?: DemoRole;
  targetPath?: string;
  roleChoiceOnly?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("authForm");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [magicLinkBusy, setMagicLinkBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const [selectedRole, setSelectedRole] = useState<DemoRole>(initialRole);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: ""
  });

  const supabaseReady = useMemo(() => hasSupabaseBrowserConfig(), []);
  const busy = submitBusy || magicLinkBusy;
  const ownerLoginOnly = selectedRole === "super_admin";
  const selectedSignupRole = signupRoles.some((role) => role.value === selectedRole) ? selectedRole : "employee";
  const inviteSignupLocked = Boolean(mode === "signup" && invitePrefill);

  useEffect(() => {
    if (!invitePrefill) {
      return;
    }

    setForm((current) => ({
      ...current,
      email: invitePrefill.email,
      company: invitePrefill.companyName
    }));
    setSelectedRole(invitePrefill.role);
  }, [invitePrefill]);

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
    setStatus(t("repairing"));
    window.location.replace("/auth/repair-profile");
  }, [authError, t]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function finalizeAuthenticatedSession() {
    const response = await fetch("/auth/callback/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inviteToken: inviteToken ?? null,
        targetPath: getSafeTargetPath(targetPath) || null,
        expectedRole: mode === "login" ? selectedRole : selectedSignupRole
      })
    });
    const payload = (await response.json().catch(() => ({}))) as { redirectTo?: string; error?: string; actualRole?: string; expectedRole?: string };

    if (response.status === 403 && payload.error === "role_mismatch") {
      throw new Error(getRoleMismatchCopy(payload.expectedRole, payload.actualRole));
    }

    if (!response.ok || !payload.redirectTo) {
      throw new Error(t("profileSetupFailed"));
    }

    window.location.assign(resolvePostAuthRedirect(payload.redirectTo));
  }

  function getRoleLabel(role?: string) {
    if (role === "manager") return t("roleNameManager");
    if (role === "company_admin") return t("roleNameCompanyAdmin");
    if (role === "platform_admin" || role === "super_admin") return t("roleNameOwner");
    return t("roleNameEmployee");
  }

  function getRoleMismatchCopy(expectedRole?: string, actualRole?: string) {
    return t("roleMismatch", { actual: getRoleLabel(actualRole), expected: getRoleLabel(expectedRole) });
  }

  function repairProfileAndOpenDashboard() {
    window.location.assign(`/auth/repair-profile?next=${encodeURIComponent(`/${locale}/dashboard`)}`);
  }

  function getAuthErrorCopy(error?: string) {
    switch (error) {
      case "auth_callback_failed":
        return t("errCallbackFailed");
      case "profile_bootstrap_failed":
        return t("errBootstrapFailed");
      case "missing_profile":
        return t("errMissingProfile");
      case "admin_required":
        return t("errAdminRequired");
      case "role_mismatch":
        return t("roleMismatchSimple", { expected: getRoleLabel(selectedRole) });
      case "password_updated":
        return t("passwordUpdated");
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
    const message = getErrorMessage(error, t("errSignInFlow"));
    const lower = message.toLowerCase();

    if (lower.includes("invalid login credentials")) {
      return t("errBadCredentials");
    }

    if (lower.includes("email not confirmed")) {
      return t("errEmailNotConfirmed");
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
        if (mode === "signup" && ownerLoginOnly) {
          throw new Error(t("errOwnerSignup"));
        }

        const authRole = mode === "signup" ? selectedSignupRole : "employee";

        if (!form.password || form.password.length < 6) {
          throw new Error(t("errShortPassword"));
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
            throw new Error(signupPayload.error || t("errCreateAccount"));
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

      throw new Error(t("errSupabaseMissing"));
    } catch (error) {
      setStatusTone("error");
      setStatus(getFriendlyAuthError(error));
    } finally {
      setSubmitBusy(false);
    }
  }

  async function sendMagicLink() {
    setMagicLinkBusy(true);
    setStatus("");
    setStatusTone("info");

    try {
      if (!supabaseReady || !form.email) {
        throw new Error(t("errEmailFirst"));
      }

      const redirectTo = new URL("/auth/verify", window.location.origin);
      if (mode === "signup" && ownerLoginOnly) {
        throw new Error(t("errOwnerSignup"));
      }

      const authRole = mode === "signup" ? selectedSignupRole : "employee";
      if (inviteToken) {
        redirectTo.searchParams.set("invite", inviteToken);
      }
      redirectTo.searchParams.set("role", mode === "login" ? selectedRole : selectedSignupRole);
      const safeTargetPath = getSafeTargetPath(targetPath);
      if (safeTargetPath) {
        redirectTo.searchParams.set("next", safeTargetPath);
      }

      const result = await requestMagicLinkEmail({
        email: form.email,
        mode: mode === "signup" ? "signup" : "login",
        redirectTo: redirectTo.toString(),
        metadata:
          mode === "signup"
            ? {
                full_name: form.name || t("defaultUserName"),
                company: form.company || t("defaultWorkspace"),
                role: authRole
              }
            : undefined
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      setStatusTone("success");
      setStatus(t("magicSentSuccess"));
    } catch (error) {
      setStatusTone("error");
      setStatus(getErrorMessage(error, t("errMagicSend")));
    } finally {
      setMagicLinkBusy(false);
    }
  }

  const authErrorCopy = getAuthErrorCopy(authError);

  return (
    <Card size="lg" className="lp-auth-card">
      <h2>{mode === "signup" ? t("titleSignup") : t("titleLogin")}</h2>
      <p className="lp-sub">{mode === "signup" ? t("introSignup") : t("introLogin")}</p>

      {roleChoiceOnly ? (
        <div aria-label={t("entryAria")}>
          <p className="lp-roles-label">{t("entryPrompt")}</p>
          <div className="lp-roles">
            {roleShortcuts.map((role) => (
              <Link className="lp-role" href={getAuthModeHref("login", role.value, getRoleTargetPath(role.value))} key={role.value}>
                {t(role.labelKey)} <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {!roleChoiceOnly && !ownerLoginOnly ? (
        <div className="lp-seg lp-seg-block" aria-label={t("modeTabsAria")}>
          <Link aria-current={mode === "login" ? "page" : undefined} href={getAuthModeHref("login", selectedRole, getRoleTargetPath(selectedRole))}>
            {t("tabLogin")}
          </Link>
          <Link aria-current={mode === "signup" ? "page" : undefined} href={getAuthModeHref("signup", selectedRole, getRoleTargetPath(selectedRole))}>
            {t("tabSignup")}
          </Link>
        </div>
      ) : null}

      {!roleChoiceOnly && !ownerLoginOnly && !inviteSignupLocked ? (
        <div style={{ marginBottom: 22 }} aria-label={mode === "signup" ? t("roleAriaSignup") : t("roleAriaLogin")}>
          <p className="lp-roles-label">{t("switchEntry")}</p>
          <div className="lp-roles lp-roles-row">
            {roleShortcuts.map((role) => (
              <Link
                className="lp-role"
                href={getAuthModeHref(mode, role.value, getRoleTargetPath(role.value))}
                key={role.value}
                aria-current={selectedRole === role.value ? "page" : undefined}
              >
                {t(role.labelKey)}
              </Link>
            ))}
          </div>
          {inviteToken ? <p className="lp-hint" style={{ marginTop: 8 }}>{t("inviteNote")}</p> : null}
        </div>
      ) : null}

      <div className="lp-stack" style={{ gap: 14, marginBottom: authErrorCopy || inviteToken || authError === "missing_profile" ? 22 : 0 }}>
        {inviteToken ? <Alert tone="info">{t("inviteStatus")}</Alert> : null}
        {authErrorCopy ? <Alert tone={authError === "password_updated" ? "success" : "error"}>{authErrorCopy}</Alert> : null}
        {authError === "missing_profile" ? (
          <Button block arrow onClick={repairProfileAndOpenDashboard} disabled={busy}>
            {t("repairCta")}
          </Button>
        ) : null}
      </div>

      {roleChoiceOnly ? null : (
        <form className="lp-form" onSubmit={handleSubmit}>
          {mode === "signup" && !ownerLoginOnly ? (
            <>
              <Field label={t("fullName")} htmlFor="name">
                <Input id="name" placeholder={t("fullNamePlaceholder")} value={form.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" required />
              </Field>
              <Field label={t("company")} htmlFor="company">
                <Input id="company" placeholder={t("companyPlaceholder")} value={form.company} onChange={(event) => updateField("company", event.target.value)} autoComplete="organization" readOnly={inviteSignupLocked} required />
              </Field>
            </>
          ) : null}
          <Field label={t("workEmail")} htmlFor="auth-email">
            <Input id="auth-email" type="email" placeholder={t("emailPlaceholder")} value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" readOnly={inviteSignupLocked} required />
          </Field>
          <Field label={t("password")} htmlFor="auth-password">
            <PasswordInput
              id="auth-password"
              placeholder={t("passwordPlaceholder")}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </Field>
          {mode === "signup" && !ownerLoginOnly ? (
            <Field label={t("accountType")} htmlFor="role">
              <Select id="role" value={selectedSignupRole} onChange={(event) => setSelectedRole(event.target.value as DemoRole)} disabled={inviteSignupLocked}>
                {signupRoles.map((role) => (
                  <option value={role.value} key={role.value}>
                    {t(role.labelKey)}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Button type="submit" block arrow disabled={busy}>
            {submitBusy ? t("working") : supabaseReady ? (mode === "signup" && !ownerLoginOnly ? t("titleSignup") : t("titleLogin")) : t("demoMode")}
          </Button>
        </form>
      )}

      {supabaseReady && !roleChoiceOnly ? (
        <div className="lp-stack" style={{ gap: 12, marginTop: 14 }}>
          <Button variant="ghost" block onClick={sendMagicLink} disabled={busy}>
            {magicLinkBusy ? t("sendingMagicLink") : mode === "signup" && !ownerLoginOnly ? t("sendMagicLink") : t("emailMagicLink")}
          </Button>
          {mode === "login" ? (
            <Button variant="ghost" block href={getLocalizedPublicPath("/forgot-password")}>
              {t("resetPassword")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {status ? (
        <Alert tone={statusTone} className="lp-mt">
          {status}
        </Alert>
      ) : null}

      <div className="lp-auth-switch">
        {mode === "signup" && !ownerLoginOnly ? <Link href={getAuthModeHref("login")}>{t("alreadyHaveAccount")}</Link> : null}
        <Link href={getLocalizedPublicPath("/")}>{t("backToSite")}</Link>
      </div>
    </Card>
  );
}
