"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Pencil, Trash2, UsersRound } from "lucide-react";
import { createTeamAction, deleteTeamAction, updateTeamAction, type TeamMutationResult } from "@/app/actions/teams";

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

function TeamEditorRow({
  team,
  managers
}: {
  team: TeamRow;
  managers: ManagerOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<TeamMutationResult>(idleState);
  const [name, setName] = useState(team.name);
  const [managerId, setManagerId] = useState(team.managerId ?? "");

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
    if (!window.confirm(`Delete ${team.name}? Team members and recognitions will be unassigned from this team.`)) {
      return;
    }

    const formData = new FormData();
    formData.set("team_id", team.id);

    startTransition(async () => {
      const result = await deleteTeamAction(formData);
      setMessage(result);
    });
  }

  return (
    <article className="team-editor-card">
      <div className="panel-top">
        <div>
          <h3>{team.name}</h3>
          <p style={{ margin: "8px 0 0", color: "var(--theme-muted)" }}>
            {team.memberCount} member{team.memberCount === 1 ? "" : "s"} · {team.recognitions} recognition{team.recognitions === 1 ? "" : "s"}
          </p>
        </div>
        <span className="quality-pill">{team.engagement}</span>
      </div>

      <form className="team-editor-form" onSubmit={handleSave}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor={`team-name-${team.id}`}>Team name</label>
            <input id={`team-name-${team.id}`} className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor={`team-manager-${team.id}`}>Manager</label>
            <select id={`team-manager-${team.id}`} className="input" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">Assign later</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="team-editor-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            <Pencil size={16} />
            {pending ? "Saving..." : "Save team"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleDelete} disabled={pending}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </form>

      {message.message ? <p className={`team-form-feedback ${message.ok ? "success" : "error"}`.trim()}>{message.message}</p> : null}
    </article>
  );
}

export function TeamManagementPanel({
  teams,
  managers
}: {
  teams: TeamRow[];
  managers: ManagerOption[];
}) {
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
    <div className="team-panel-stack">
      <form className="panel inline-demo-form team-create-panel" onSubmit={handleCreate}>
        <div className="panel-top">
          <div>
            <h3>Create team</h3>
            <p style={{ margin: "8px 0 0", color: "var(--theme-muted)" }}>
              Create a new team and optionally connect it to an existing manager in your company.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="team-name">Team name</label>
            <input id="team-name" className="input" placeholder="Customer Success" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="team-manager">Manager</label>
            <select id="team-manager" className="input" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">Assign later</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={pending}>
          <UsersRound size={16} />
          {pending ? "Creating..." : "Create team"}
        </button>

        {message.message ? (
          <p className={`team-form-feedback ${message.ok ? "success" : "error"}`.trim()}>
            {message.ok ? <CheckCircle2 size={16} /> : null}
            <span>{message.message}</span>
          </p>
        ) : null}
      </form>

      {teams.length ? (
        <div className="team-editor-list">
          {teams.map((team) => (
            <TeamEditorRow key={team.id} team={team} managers={managers} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
