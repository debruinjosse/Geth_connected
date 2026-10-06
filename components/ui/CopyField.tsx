"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Read-only value (e.g. an invite link) with a copy button. */
export function CopyField({ value, label, copyLabel, copiedLabel }: { value: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="lp-copyfield">
      <input className="lp-input" value={value} readOnly aria-label={label} onFocus={(event) => event.currentTarget.select()} />
      <button type="button" className="lp-btn lp-btn-ghost lp-btn-sm" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
