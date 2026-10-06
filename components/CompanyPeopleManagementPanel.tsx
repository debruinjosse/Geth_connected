"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MailPlus, UserCheck, UserX } from "lucide-react";
import {
  assignManagerToTeamAction,
  removeManagerFromTeamAction,
  revokeInvitationAction,
  updateProfileStatusAction,
  updateProfileTeamAction,
  type CompanyPeopleMutationResult
} from "@/app/actions/companyPeople";
import { resendInvitationEmailAction } from "@/app/actions/invitations";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { Field, Select } from "@/components/ui/Fields";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

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
  return <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>;
}

function statusLabel(status: PersonRow["status"], t: ReturnType<typeof useTranslations>) {
  switch (status) {
    case "active":
      return t("statusActive");
    case "disabled":
      return t("statusDisabled");
    case "invited":
      return t("statusInvited");
    default:
      return status;
  }
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
  const t = useTranslations("companyPeople");
  const ti = useTranslations("invitations");
  const tc = useTranslations("common");
  const [message, setMessage] = useState<CompanyPeopleMutationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: (formData: FormData) => Promise<CompanyPeopleMutationResult>, formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      setMessage(result);
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

  function renderAccess(person: PersonRow) {
    return (
      <form
        className="lp-access-form"
        action={(formData) => {
          formData.set("profile_id", person.id);
          formData.set("role", person.role);
          formData.set("status", person.status === "disabled" ? "active" : "disabled");
          runAction(updateProfileStatusAction, formData);
        }}
      >
        <Button type="submit" variant={person.status === "disabled" ? "primary" : "ghost"} size="sm" disabled={isPending} icon={person.status === "disabled" ? <UserCheck /> : <UserX />}>
          {person.status === "disabled" ? t("restoreAccess") : t("removeAccess")}
        </Button>
      </form>
    );
  }

  return (
    <div className="lp-stack">
      <Feedback state={message} />

      {people.length ? (
        <Panel>
          <div className="lp-edit-list">
            {people.map((person) => (
              <div className="lp-edit-row" key={person.id}>
                <div className="lp-edit-head">
                  <span className="lp-person">
                    <Avatar name={person.name} />
                    <span>
                      <b>{person.name}</b>
                      <small>{person.email ?? person.role}</small>
                    </span>
                  </span>
                  <span className="lp-edit-pills">
                    {typeof person.cards === "number" ? <Pill>{t("cardsReceived", { count: person.cards })}</Pill> : null}
                    <Pill tone={person.status === "active" ? "green" : person.status === "disabled" ? "neutral" : "gold"}>{statusLabel(person.status, t)}</Pill>
                  </span>
                </div>

                <div className="lp-edit-grid">
                  <form
                    className="lp-inline-form"
                    action={(formData) => {
                      formData.set("profile_id", person.id);
                      formData.set("role", person.role);
                      runAction(updateProfileTeamAction, formData);
                    }}
                  >
                    <Field label={mode === "employee" ? t("teamAssignment") : t("defaultProfileTeam")} htmlFor={`${person.id}-team`}>
                      <Select id={`${person.id}-team`} name="team_id" defaultValue={person.teamId ?? ""}>
                        <option value="">{tc("unassigned")}</option>
                        {teams.map((team) => (
                          <option value={team.id} key={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
                      {t("saveTeam")}
                    </Button>
                  </form>

                  {mode === "employee" ? renderAccess(person) : null}
                  {mode === "manager" ? (
                    <form
                      className="lp-inline-form"
                      action={(formData) => {
                        formData.set("manager_id", person.id);
                        runAction(assignManagerToTeamAction, formData);
                      }}
                    >
                      <Field label={t("managedTeam")} htmlFor={`${person.id}-managed-team`}>
                        <Select id={`${person.id}-managed-team`} name="team_id" defaultValue={person.managedTeamIds?.[0] ?? ""}>
                          <option value="">{t("chooseTeam")}</option>
                          {teams.map((team) => (
                            <option value={team.id} key={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
                        {t("assignManager")}
                      </Button>
                    </form>
                  ) : null}
                </div>

                {mode === "manager" ? (
                <div className="lp-edit-foot">
                  <div className="lp-edit-chips">
                    {mode === "manager"
                      ? (person.managedTeamIds ?? []).map((teamId) => {
                          const team = teams.find((item) => item.id === teamId);
                          return (
                            <form
                              key={teamId}
                              className="lp-chip-form"
                              action={(formData) => {
                                formData.set("team_id", teamId);
                                runAction(removeManagerFromTeamAction, formData);
                              }}
                            >
                              <span>{team?.name ?? t("managedTeam")}</span>
                              <button type="submit" disabled={isPending} aria-label={t("remove")} title={t("remove")}>
                                ×
                              </button>
                            </form>
                          );
                        })
                      : null}
                  </div>
                  {mode === "manager" ? renderAccess(person) : null}
                </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {pendingInvites.length ? (
        <Panel title={mode === "employee" ? t("pendingEmployeeInvitations") : t("pendingManagerInvitations")}>
          <div className="lp-edit-list">
            {pendingInvites.map((invite) => (
              <div className="lp-edit-row" key={invite.id}>
                <div className="lp-edit-head">
                  <div>
                    <b>{invite.email}</b>
                    <small>{invite.teamName}</small>
                  </div>
                  <span className="lp-edit-actions">
                    <Button variant="ghost" size="sm" onClick={() => resendInvite(invite)} disabled={isPending} icon={<MailPlus />}>
                      {t("resendEmail")}
                    </Button>
                    <form
                      action={(formData) => {
                        formData.set("invitation_id", invite.id);
                        runAction(revokeInvitationAction, formData);
                      }}
                    >
                      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
                        {t("revoke")}
                      </Button>
                    </form>
                  </span>
                </div>
                <CopyField value={invite.inviteLink} label={`Invite link for ${invite.email}`} copyLabel={ti("copy")} copiedLabel={ti("copied")} />
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
