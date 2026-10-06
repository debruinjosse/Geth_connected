"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { buttonClass } from "@/components/ui/Button";
import { deleteCompanyAction } from "@/app/actions/adminControls";

export function AdminCompanyDeleteButton({
  companyId,
  locale,
  confirmMessage,
  deleteLabel,
}: {
  companyId: string;
  locale: string;
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
        <form action={deleteCompanyAction}>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="locale" value={locale} />
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
