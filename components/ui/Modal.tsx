"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx } from "@/components/ui/cx";

/** Accessible dialog: closes on Esc / backdrop click, locks page scroll, restores focus. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
  closeLabel = "Close"
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  closeLabel?: string;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="lp lp-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panel} className={cx("lp-modal", wide && "lp-modal-wide")} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <button className="lp-modal-close" type="button" onClick={onClose} aria-label={closeLabel}>
          <X />
        </button>
        <h2 id={titleId}>{title}</h2>
        {children ? <div className="lp-modal-body">{children}</div> : null}
        {footer ? <div className="lp-modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
