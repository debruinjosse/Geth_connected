"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/** Small (i) button that opens a text popover; closes on outside click or Esc. */
export function InfoPopover({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="lp-info" ref={wrap}>
      <button type="button" aria-label={text} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Info />
      </button>
      {open ? (
        <span className="lp-info-pop" role="tooltip">
          {text}
        </span>
      ) : null}
    </span>
  );
}
