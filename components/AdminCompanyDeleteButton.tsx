"use client";

import { deleteCompanyAction } from "@/app/actions/adminControls";

export function AdminCompanyDeleteButton({
  companyId,
  companyName,
  locale
}: {
  companyId: string;
  companyName: string;
  locale: string;
}) {
  return (
    <form action={deleteCompanyAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="locale" value={locale} />
      <button
        className="btn btn-secondary compact"
        type="submit"
        onClick={(event) => {
          if (
            !window.confirm(
              `Delete ${companyName}? This permanently removes the company workspace, teams, users, and recognition data.`
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}
