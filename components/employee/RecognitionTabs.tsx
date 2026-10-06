"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { Panel } from "@/components/ui/Panel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

/** Received / given recognitions behind one segmented switch. */
export function RecognitionTabs({
  received,
  given,
  receivedLabel,
  givenLabel,
  receivedCount,
  givenCount,
  receivedEmpty,
  givenEmpty,
  ariaLabel
}: {
  received: RecognitionItem[];
  given: RecognitionItem[];
  receivedLabel: string;
  givenLabel: string;
  receivedCount: string;
  givenCount: string;
  receivedEmpty: ReactNode;
  givenEmpty: ReactNode;
  ariaLabel: string;
}) {
  const [tab, setTab] = useState<"received" | "given">("received");
  const items = tab === "received" ? received : given;

  return (
    <Panel
      title={tab === "received" ? receivedLabel : givenLabel}
      action={<span className="lp-pill">{tab === "received" ? receivedCount : givenCount}</span>}
    >
      <div className="lp-mb">
        <SegmentedControl
          label={ariaLabel}
          value={tab}
          onChange={setTab}
          options={[
            { value: "received", label: receivedLabel },
            { value: "given", label: givenLabel }
          ]}
        />
      </div>
      {items.length ? <RecognitionList items={items} /> : tab === "received" ? receivedEmpty : givenEmpty}
    </Panel>
  );
}
