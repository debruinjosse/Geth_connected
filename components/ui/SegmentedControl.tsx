"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type SegmentOption<T extends string> = { value: T; label: ReactNode; sublabel?: ReactNode };

/** Pill-shaped switch between a few mutually exclusive options (billing period, view mode…). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  block,
  className
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  block?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("lp-seg", block && "lp-seg-block", className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
          {option.sublabel ? <small>{option.sublabel}</small> : null}
        </button>
      ))}
    </div>
  );
}
