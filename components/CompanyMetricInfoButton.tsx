"use client";

import { InfoPopover } from "@/components/ui/InfoPopover";

/** Legacy name kept for existing imports. */
export function CompanyMetricInfoButton({ text }: { text: string }) {
  return <InfoPopover text={text} />;
}
