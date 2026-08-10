"use client";

import { deleteCompanyTeamAction } from "@/app/actions/adminControls";

export function AdminTeamDeleteButton({
  teamId,
  companyId,
  locale,
  returnTo,
  confirmMessage,
  deleteLabel
}: {
  teamId: string;
  companyId: string;
  locale: string;
  returnTo: string;
  confirmMessage: string;
  deleteLabel: string;
}) {
  return (
    <form action={deleteCompanyTeamAction}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        className="btn btn-secondary compact"
        type="submit"
        onClick={(event) => {
          if (!window.confirm(confirmMessage)) {
            event.preventDefault();
          }
        }}
      >
        {deleteLabel}
      </button>
    </form>
  );
}
