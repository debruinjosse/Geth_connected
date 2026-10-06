"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { MailPlus } from "lucide-react";
import { createInvitationAction, type InvitationActionState } from "@/app/actions/invitations";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { Field, FieldGrid, Input, Select } from "@/components/ui/Fields";
import { Panel } from "@/components/ui/Panel";

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

  return (
    <Panel title={title} description={description}>
      <form className="lp-form" action={formAction}>
        <FieldGrid>
          <Field label={t("workEmail")} htmlFor={`${defaultRole}-invite-email`}>
            <Input id={`${defaultRole}-invite-email`} name="email" placeholder={t("emailPlaceholder")} type="email" required />
          </Field>
          <Field label={t("role")} htmlFor={`${defaultRole}-invite-role`}>
            <Select id={`${defaultRole}-invite-role`} name="role" defaultValue={defaultRole}>
              <option value="employee">{t("roleEmployee")}</option>
              <option value="manager">{t("roleManager")}</option>
            </Select>
          </Field>
          <Field className="lp-span-2" label={t("teamAssignment")} htmlFor={`${defaultRole}-invite-team`}>
            <Select id={`${defaultRole}-invite-team`} name="team_id" defaultValue="">
              <option value="">{t("assignLater")}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <div>
          <Button type="submit" disabled={pending} icon={<MailPlus />}>
            {pending ? t("creatingInvite") : t("generateInviteLink")}
          </Button>
        </div>

        {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

        {state.ok && state.inviteLink ? (
          <div className="lp-invite-card">
            <div>
              <b>{state.inviteEmail}</b>
              <small>
                {state.emailSent ? t("emailSent") : t("emailNotSent")} · {t("expires")} {state.expiresAt ? new Date(state.expiresAt).toLocaleDateString() : t("soon")}
              </small>
            </div>
            <CopyField value={state.inviteLink} label={t("inviteLinkAria")} copyLabel={t("copy")} copiedLabel={t("copied")} />
          </div>
        ) : null}
      </form>
    </Panel>
  );
}
