"use client";

import { useActionState } from "react";
import { CheckCircle2, UploadCloud, XCircle } from "lucide-react";
import { bulkImportEmployeesAction, type BulkEmployeeImportState } from "@/app/actions/invitations";

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
  const [state, formAction, pending] = useActionState(bulkImportEmployeesAction, initialState);
  const sampleHref = `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`;

  return (
    <form className="panel dashboard-panel invitation-panel" action={formAction}>
      <div className="panel-top">
        <div>
          <h2>Bulk import onboarding CSV</h2>
          <p className="section-copy">
            Upload one company employee file to create departments as teams and generate employee or manager invitations in bulk.
          </p>
        </div>
        <a className="btn btn-secondary compact" href={sampleHref} download="geth-employee-import-template.csv">
          Download template
        </a>
      </div>

      <div className="form-grid">
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="employee-csv-import">CSV file</label>
          <input id="employee-csv-import" className="input" name="csv_file" type="file" accept=".csv,text/csv" required />
        </div>

        <label className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span>Expected columns</span>
          <code className="inline-code">name,email,department,manager_email,role</code>
        </label>

        <label className="checkbox-row" style={{ gridColumn: "1 / -1" }}>
          <input name="send_emails" type="checkbox" defaultChecked />
          <span>Send branded invitation emails after creating invite links</span>
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        <UploadCloud size={16} />
        {pending ? "Importing CSV..." : "Import employees"}
      </button>

      {state.message ? (
        <div className={`invite-feedback ${state.ok ? "success" : "error"}`.trim()}>
          {state.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{state.message}</span>
        </div>
      ) : null}

      {state.createdInvites !== undefined ? (
        <div className="invite-link-card">
          <div className="invite-link-meta">
            <strong>Import summary</strong>
            <small>
              {state.createdInvites ?? 0} invites created - {state.teamsTouched ?? 0} teams created - {state.managerInvites ?? 0} manager invites - {state.skippedRows ?? 0} skipped
            </small>
          </div>
          <small>
            Email sent: {state.emailSent ?? 0}. Email failed: {state.emailFailed ?? 0}. Copy links remain available below in pending invitations.
          </small>
          {state.errors?.length ? (
            <ul className="import-error-list">
              {state.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
