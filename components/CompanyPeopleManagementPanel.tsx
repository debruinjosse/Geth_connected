"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Copy, MailPlus, UserCheck, UserX, XCircle } from "lucide-react";
import {
  assignManagerToTeamAction,
  removeManagerFromTeamAction,
  revokeInvitationAction,
  updateProfileStatusAction,
  updateProfileTeamAction,
  type CompanyPeopleMutationResult
} from "@/app/actions/companyPeople";
import { resendInvitationEmailAction } from "@/app/actions/invitations";

type TeamOption = {
  id: string;
  name: string;
  managerId?: string | null;
};

type PersonRow = {
  id: string;
  name: string;
  email?: string | null;
  role: "employee" | "manager";
  teamId: string | null;
  teamName: string;
  status: "active" | "invited" | "disabled";
  cards?: number;
  managedTeamIds?: string[];
};

type PendingInvite = {
  id: string;
  email: string;
  role: "employee" | "manager";
  teamName: string;
  inviteLink: string;
};

function Feedback({ state }: { state: CompanyPeopleMutationResult | null }) {
  if (!state?.message) return null;

  return (
    <p className={`team-form-feedback ${state.ok ? "success" : "error"}`.trim()}>
      {state.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {state.message}
    </p>
  );
}

export function CompanyPeopleManagementPanel({
  mode,
  people,
  teams,
  pendingInvites
}: {
  mode: "employee" | "manager";
  people: PersonRow[];
  teams: TeamOption[];
  pendingInvites: PendingInvite[];
}) {
  const [message, setMessage] = useState<CompanyPeopleMutationResult | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: (formData: FormData) => Promise<CompanyPeopleMutationResult>, formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      setMessage(result);
    });
  }

  function copyInvite(invite: PendingInvite) {
    startTransition(async () => {
      await navigator.clipboard.writeText(invite.inviteLink);
      setCopiedInviteId(invite.id);
      window.setTimeout(() => setCopiedInviteId(null), 1800);
    });
  }

  function resendInvite(invite: PendingInvite) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("invitation_id", invite.id);
      const result = await resendInvitationEmailAction(formData);
      setMessage({
        ok: result.ok,
        message: result.message
      });
    });
  }

  return (
    <div className="team-panel-stack">
      <Feedback state={message} />

      {people.length ? (
        <div className="team-editor-list">
          {people.map((person) => (
            <article className="team-editor-card people-editor-card" key={person.id}>
              <div className="people-editor-head">
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.email ?? person.role}</p>
                </div>
                <span className={`energy ${person.status === "active" ? "high" : person.status === "disabled" ? "low" : "mid"}`.trim()}>
                  {person.status}
                </span>
              </div>

              <div className="people-editor-grid">
                <form
                  className="people-inline-form"
                  action={(formData) => {
                    formData.set("profile_id", person.id);
                    formData.set("role", person.role);
                    runAction(updateProfileTeamAction, formData);
                  }}
                >
                  <label htmlFor={`${person.id}-team`}>{mode === "employee" ? "Team assignment" : "Default profile team"}</label>
                  <select id={`${person.id}-team`} className="input" name="team_id" defaultValue={person.teamId ?? ""}>
                    <option value="">Unassigned</option>
                    {teams.map((team) => (
                      <option value={team.id} key={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" type="submit" disabled={isPending}>
                    Save team
                  </button>
                </form>

                {mode === "manager" ? (
                  <form
                    className="people-inline-form"
                    action={(formData) => {
                      formData.set("manager_id", person.id);
                      runAction(assignManagerToTeamAction, formData);
                    }}
                  >
                    <label htmlFor={`${person.id}-managed-team`}>Managed team</label>
                    <select id={`${person.id}-managed-team`} className="input" name="team_id" defaultValue={person.managedTeamIds?.[0] ?? ""}>
                      <option value="">Choose team</option>
                      {teams.map((team) => (
                        <option value={team.id} key={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-secondary" type="submit" disabled={isPending}>
                      Assign manager
                    </button>
                  </form>
                ) : null}
              </div>

              {mode === "manager" && person.managedTeamIds?.length ? (
                <div className="people-managed-teams">
                  {person.managedTeamIds.map((teamId) => {
                    const team = teams.find((item) => item.id === teamId);
                    return (
                      <form
                        key={teamId}
                        action={(formData) => {
                          formData.set("team_id", teamId);
                          runAction(removeManagerFromTeamAction, formData);
                        }}
                      >
                        <span>{team?.name ?? "Managed team"}</span>
                        <button className="btn btn-secondary" type="submit" disabled={isPending}>
                          Remove
                        </button>
                      </form>
                    );
                  })}
                </div>
              ) : null}

              <div className="team-editor-actions">
                <form
                  action={(formData) => {
                    formData.set("profile_id", person.id);
                    formData.set("role", person.role);
                    formData.set("status", person.status === "disabled" ? "active" : "disabled");
                    runAction(updateProfileStatusAction, formData);
                  }}
                >
                  <button className={`btn ${person.status === "disabled" ? "btn-primary" : "btn-secondary"}`} type="submit" disabled={isPending}>
                    {person.status === "disabled" ? <UserCheck size={16} /> : <UserX size={16} />}
                    {person.status === "disabled" ? "Reactivate" : "Disable"}
                  </button>
                </form>
                {typeof person.cards === "number" ? <span className="quality-pill">{person.cards} cards received</span> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {pendingInvites.length ? (
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Pending {mode === "employee" ? "employee" : "manager"} invitations</h2>
          </div>
          <div className="invite-success-stack">
            {pendingInvites.map((invite) => (
              <div className="invite-link-card" key={invite.id}>
                <div className="invite-link-meta">
                  <strong>{invite.email}</strong>
                  <small>{invite.teamName}</small>
                </div>
                <div className="invite-link-row">
                  <input className="input" value={invite.inviteLink} readOnly aria-label={`Invite link for ${invite.email}`} />
                  <button className="btn btn-secondary" type="button" onClick={() => copyInvite(invite)} disabled={isPending}>
                    <Copy size={16} />
                    {copiedInviteId === invite.id ? "Copied" : "Copy"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => resendInvite(invite)} disabled={isPending}>
                    <MailPlus size={16} />
                    Resend email
                  </button>
                  <form
                    action={(formData) => {
                      formData.set("invitation_id", invite.id);
                      runAction(revokeInvitationAction, formData);
                    }}
                  >
                    <button className="btn btn-secondary" type="submit" disabled={isPending}>
                      Revoke
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </div>
  );
}
