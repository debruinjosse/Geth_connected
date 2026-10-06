import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** Minimal data table: hairline rows, quiet uppercase headers. Use `<th>`/`<td>` normally; add `className="lp-c"` to centre a cell. */
export function Table({ caption, children, className }: { caption?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("lp-table-wrap", className)}>
      <table className="lp-table">
        {caption ? <caption>{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
