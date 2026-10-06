import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Labelled checkbox row. */
export function Checkbox({ label, ...rest }: { label: ReactNode } & Omit<ComponentPropsWithoutRef<"input">, "type">) {
  return (
    <label className="lp-check">
      <input type="checkbox" {...rest} />
      <span className="lp-check-box" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
