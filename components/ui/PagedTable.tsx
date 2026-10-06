"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Table } from "@/components/ui/Table";

/** Table with client-side pagination. Pass the `<tr>` rows as an array; the pager hides itself when one page is enough. */
export function PagedTable({
  head,
  rows,
  pageSize = 8,
  className,
  pageLabel = "Page",
  previousLabel = "Previous",
  nextLabel = "Next"
}: {
  head: ReactNode;
  rows: ReactNode[];
  pageSize?: number;
  className?: string;
  pageLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <>
      <Table className={className}>
        <thead>{head}</thead>
        <tbody>{visible}</tbody>
      </Table>
      {pages > 1 ? (
        <nav className="lp-pager" aria-label={pageLabel}>
          <span>
            {pageLabel} {current + 1} / {pages}
          </span>
          <div>
            <button type="button" className="lp-pager-btn" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label={previousLabel}>
              <ChevronLeft />
            </button>
            <button type="button" className="lp-pager-btn" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label={nextLabel}>
              <ChevronRight />
            </button>
          </div>
        </nav>
      ) : null}
    </>
  );
}
