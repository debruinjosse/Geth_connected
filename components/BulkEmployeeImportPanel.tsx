"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { FileUp, UploadCloud } from "lucide-react";
import { bulkImportEmployeesAction, type BulkEmployeeImportState } from "@/app/actions/invitations";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Fields";
import { Panel } from "@/components/ui/Panel";

const initialState: BulkEmployeeImportState = {
  ok: false,
  message: ""
};

const sampleCsv = [
  "name,email,department,manager_email,role",
  "Jamie Miller,jamie@company.com,Marketing,mark@company.com,employee",
  "Mark de Vries,mark@company.com,Marketing,,manager",
  "Lisa Jansen,lisa@company.com,Design,sarah@company.com,employee"
].join("\n");

export function BulkEmployeeImportPanel() {
  const t = useTranslations("bulkImport");
  const [state, formAction, pending] = useActionState(bulkImportEmployeesAction, initialState);
  const [fileName, setFileName] = useState("");
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`;

  return (
    <Panel
      title={t("title")}
      description={t("copy")}
      action={
        <Button href={sampleHref} download="geth-employee-import-template.csv" variant="ghost" size="sm">
          {t("downloadTemplate")}
        </Button>
      }
    >
      <form className="lp-form" action={formAction}>
        <Field label={t("csvFile")} htmlFor="employee-csv-import">
          <label className="lp-upload" htmlFor="employee-csv-import">
            <FileUp aria-hidden="true" />
            <span>
              <b>{fileName || t("csvFile")}</b>
              <small>.csv</small>
            </span>
            <input id="employee-csv-import" name="csv_file" type="file" accept=".csv,text/csv" required onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")} />
          </label>
        </Field>

        <Field label={t("expectedColumns")}>
          <code className="lp-code">name,email,department,manager_email,role</code>
        </Field>

        <Checkbox name="send_emails" defaultChecked label={t("sendEmails")} />

        <div>
          <Button type="submit" disabled={pending} icon={<UploadCloud />}>
            {pending ? t("importing") : t("importEmployees")}
          </Button>
        </div>

        {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

        {state.createdInvites !== undefined ? (
          <div className="lp-invite-card">
            <div>
              <b>{t("importSummary")}</b>
              <small>
                {t("importSummaryDetail", {
                  invites: state.createdInvites ?? 0,
                  teams: state.teamsTouched ?? 0,
                  managers: state.managerInvites ?? 0,
                  skipped: state.skippedRows ?? 0
                })}
              </small>
            </div>
            <small>
              {t("emailSent", { count: state.emailSent ?? 0 })} {t("emailFailed", { count: state.emailFailed ?? 0 })} {t("copyLinksHint")}
            </small>
            {state.errors?.length ? (
              <ul className="lp-error-list">
                {state.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </form>
    </Panel>
  );
}
