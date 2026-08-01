"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

export function CompanyMetricInfoButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (wrapRef.current && target && !wrapRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <span className="company-kpi-info-wrap" ref={wrapRef}>
      <button
        type="button"
        className="company-kpi-info"
        aria-label={text}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Info size={13} />
      </button>
      {open ? (
        <span className="company-kpi-info-popover" role="tooltip">
          {text}
        </span>
      ) : null}
    </span>
  );
}
