import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** Label + control + hint/error. Pass the control as children; give it the same `id` as `htmlFor`. */
export function Field({
  label,
  htmlFor,
  required,
  requiredLabel = "required",
  hint,
  error,
  className,
  children
}: {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  requiredLabel?: string;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("lp-field", className)}>
      {label ? (
        <label className="lp-label" htmlFor={htmlFor}>
          {label}
          {required ? (
            <span className="lp-req" aria-label={requiredLabel}>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <small className="lp-error" id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">
          {error}
        </small>
      ) : hint ? (
        <small className="lp-hint">{hint}</small>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...rest }: ComponentPropsWithoutRef<"input"> & { invalid?: boolean }) {
  return <input className={cx("lp-input", className)} aria-invalid={invalid || undefined} {...rest} />;
}

export function Textarea({ className, invalid, ...rest }: ComponentPropsWithoutRef<"textarea"> & { invalid?: boolean }) {
  return <textarea className={cx("lp-input", className)} aria-invalid={invalid || undefined} {...rest} />;
}

export function Select({ className, invalid, children, ...rest }: ComponentPropsWithoutRef<"select"> & { invalid?: boolean }) {
  return (
    <select className={cx("lp-input", className)} aria-invalid={invalid || undefined} {...rest}>
      {children}
    </select>
  );
}

/** Two-column responsive grid for form fields; add `lp-span-2` to a field to span both columns. */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("lp-field-grid", className)}>{children}</div>;
}
