"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { buttonClass } from "@/components/ui/Button";
import { deleteCompanyTeamAction } from "@/app/actions/adminControls";

export function AdminTeamDeleteButton({
  teamId,
  companyId,
  locale,
  returnTo,
  confirmMessage,
  deleteLabel,
}: {
  teamId: string;
  companyId: string;
  locale: string;
  returnTo: string;
  confirmMessage: string;
  deleteLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={buttonClass({ variant: "ghost", size: "sm" })}
        type="button"
        onClick={() => setOpen(true)}
      >
        {deleteLabel}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={deleteLabel}>
        <p>{confirmMessage}</p>
        <form action={deleteCompanyTeamAction}>
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="lp-form-actions">
            <button
              className={buttonClass({ variant: "primary" })}
              type="submit"
            >
              {deleteLabel}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
