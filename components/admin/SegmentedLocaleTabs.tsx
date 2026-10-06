"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

/** Switch between the EN and NL editors; both stay mounted so unsaved edits survive a switch. */
export function SegmentedLocaleTabs({ en, nl }: { en: ReactNode; nl: ReactNode }) {
  const [locale, setLocale] = useState<"en" | "nl">("en");
  return (
    <div className="lp-stack">
      <SegmentedControl
        label="Language"
        value={locale}
        onChange={setLocale}
        options={[
          { value: "en", label: "English" },
          { value: "nl", label: "Nederlands" }
        ]}
      />
      <div hidden={locale !== "en"}>{en}</div>
      <div hidden={locale !== "nl"}>{nl}</div>
    </div>
  );
}
