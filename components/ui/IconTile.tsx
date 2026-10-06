import type { ReactNode } from "react";

export function IconTile({ children }: { children: ReactNode }) {
  return (
    <span className="lp-icontile" aria-hidden="true">
      {children}
    </span>
  );
}
