"use client";

import { useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cx } from "@/components/ui/cx";

/** Password field with a show/hide toggle. */
export function PasswordInput({
  className,
  showLabel,
  hideLabel,
  invalid,
  ...rest
}: Omit<ComponentPropsWithoutRef<"input">, "type"> & { showLabel: string; hideLabel: string; invalid?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="lp-input-wrap">
      <input className={cx("lp-input", className)} type={visible ? "text" : "password"} aria-invalid={invalid || undefined} {...rest} />
      <button className="lp-input-toggle" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? hideLabel : showLabel}>
        {visible ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}
