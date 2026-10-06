"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, UsersRound } from "lucide-react";
import { createTeamAction, deleteTeamAction, updateTeamAction, type TeamMutationResult } from "@/app/actions/teams";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Fields";
import { Grid } from "@/components/ui/Grid";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

type ManagerOption = {
  id: string;
  name: string;
};

type TeamRow = {
  id: string;
  name: string;
  managerId: string | null;
  managerName: string;
  memberCount: number;
  engagement: string;
  recognitions: number;
};

const idleState: TeamMutationResult = {
  ok: false,
  message: ""
};

function TeamEditorRow({ team, managers }: { team: TeamRow; managers: ManagerOption[] }) {
  const t = useTranslations("teamManagement");
  const tl = useTranslations("landingV2");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<TeamMutationResult>(idleState);
  const [name, setName] = useState(team.name);
  const [managerId, setManagerId] = useState(team.managerId ?? "");
  const [confirming, setConfirming] = useState(false);

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("team_id", team.id);
    formData.set("name", name);
    formData.set("manager_id", managerId);

    startTransition(async () => {
      const result = await updateTeamAction(formData);
      setMessage(result);
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("team_id", team.id);

    startTransition(async () => {
      const result = await deleteTeamAction(formData);
      setMessage(result);
      setConfirming(false);
    });
  }

  return (
    <div className="lp-edit-row">
      <div className="lp-edit-head">
        <div>
          <b>{team.name}</b>
          <small>{t("memberRecognitionSummary", { members: team.memberCount, recognitions: team.recognitions })}</small>
        </div>
        <Pill tone="gold">{team.engagement}</Pill>
      </div>

      <form className="lp-edit-form" onSubmit={handleSave}>
        <Field label={t("teamName")} htmlFor={`team-name-${team.id}`}>
          <Input id={`team-name-${team.id}`} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label={t("manager")} htmlFor={`team-manager-${team.id}`}>
          <Select id={`team-manager-${team.id}`} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
            <option value="">{t("assignLater")}</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="lp-edit-actions">
          <Button type="submit" size="sm" disabled={pending} icon={<Pencil />}>
            {pending ? t("saving") : t("saveTeam")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} disabled={pending} icon={<Trash2 />}>
            {t("delete")}
          </Button>
        </div>
      </form>

      {message.message ? <Alert tone={message.ok ? "success" : "error"}>{message.message}</Alert> : null}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        closeLabel={tl("close")}
        title={t("delete")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {tl("close")}
            </Button>
            <Button onClick={handleDelete} disabled={pending} icon={<Trash2 />}>
              {t("delete")}
            </Button>
          </>
        }
      >
        {t("deleteConfirm", { name: team.name })}
      </Modal>
    </div>
  );
}

export function TeamManagementPanel({ teams, managers }: { teams: TeamRow[]; managers: ManagerOption[] }) {
  const t = useTranslations("teamManagement");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<TeamMutationResult>(idleState);
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("manager_id", managerId);

    startTransition(async () => {
      const result = await createTeamAction(formData);
      setMessage(result);
      if (result.ok) {
        setName("");
        setManagerId("");
      }
    });
  }

  return (
    <Grid cols="two">
      <Panel title={t("createTeam")} description={t("createTeamCopy")}>
        <form className="lp-form" onSubmit={handleCreate}>
          <Field label={t("teamName")} htmlFor="team-name">
            <Input id="team-name" placeholder="Customer Success" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label={t("manager")} htmlFor="team-manager">
            <Select id="team-manager" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">{t("assignLater")}</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <Button type="submit" disabled={pending} icon={<UsersRound />}>
              {pending ? t("creating") : t("createTeam")}
            </Button>
          </div>
          {message.message ? <Alert tone={message.ok ? "success" : "error"}>{message.message}</Alert> : null}
        </form>
      </Panel>

      {teams.length ? (
        <Panel>
          <div className="lp-edit-list">
            {teams.map((team) => (
              <TeamEditorRow key={team.id} team={team} managers={managers} />
            ))}
          </div>
        </Panel>
      ) : null}
    </Grid>
  );
}
