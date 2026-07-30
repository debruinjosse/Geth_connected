"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Copy, MailPlus } from "lucide-react";
import { createInvitationAction, type InvitationActionState } from "@/app/actions/invitations";

const initialState: InvitationActionState = {
  ok: false,
  message: ""
};

export function InvitationPanel({
  title,
  description,
  defaultRole,
  teams
}: {
  title: string;
  description: string;
  defaultRole: "employee" | "manager";
  teams: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("invitations");
  const [state, formAction, pending] = useActionState(createInvitationAction, initialState);
  const [copied, setCopied] = useState(false);
  const [isCopying, startCopyTransition] = useTransition();

  function handleCopy(link: string) {
    startCopyTransition(async () => {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopied(false);
      }
    });
  }

  return (
    <form className="panel inline-demo-form invitation-panel" action={formAction}>
      <div className="panel-top">
        <div>
          <h3>{title}</h3>
          <p style={{ margin: "8px 0 0", color: "var(--theme-muted)" }}>{description}</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`${defaultRole}-invite-email`}>{t("workEmail")}</label>
          <input id={`${defaultRole}-invite-email`} name="email" className="input" placeholder={t("emailPlaceholder")} type="email" required />
        </div>

        <div className="form-field">
          <label htmlFor={`${defaultRole}-invite-role`}>{t("role")}</label>
          <select id={`${defaultRole}-invite-role`} name="role" className="input" defaultValue={defaultRole}>
            <option value="employee">{t("roleEmployee")}</option>
            <option value="manager">{t("roleManager")}</option>
          </select>
        </div>

        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor={`${defaultRole}-invite-team`}>{t("teamAssignment")}</label>
          <select id={`${defaultRole}-invite-team`} name="team_id" className="input" defaultValue="">
            <option value="">{t("assignLater")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        <MailPlus size={16} />
        {pending ? t("creatingInvite") : t("generateInviteLink")}
      </button>

      {state.message ? (
        <div className={`invite-feedback ${state.ok ? "success" : "error"}`.trim()}>
          {state.ok ? <CheckCircle2 size={18} /> : null}
          <span>{state.message}</span>
        </div>
      ) : null}

      {state.ok && state.inviteLink ? (
        <div className="invite-link-card">
          <div className="invite-link-meta">
            <strong>{state.inviteEmail}</strong>
            <small>
              {state.emailSent ? t("emailSent") : t("emailNotSent")} - {t("expires")} {state.expiresAt ? new Date(state.expiresAt).toLocaleDateString() : t("soon")}
            </small>
          </div>
          <div className="invite-link-row">
            <input className="input" value={state.inviteLink} readOnly aria-label={t("inviteLinkAria")} />
            <button className="btn btn-secondary" type="button" onClick={() => handleCopy(state.inviteLink!)} disabled={isCopying}>
              <Copy size={16} />
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
