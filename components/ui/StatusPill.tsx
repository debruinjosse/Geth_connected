import type { ReactNode } from "react";
import { Pill } from "@/components/ui/Pill";

const GREEN = new Set(["active", "paid", "approved", "success", "ok", "configured", "trialing", "high"]);
const GOLD = new Set(["pending", "demo", "requested", "rescheduled", "draft", "open", "invited", "mid", "issued", "invoice_issued", "requested"]);

/** Pill whose colour follows a raw status value (green = good, gold = waiting, neutral = everything else). */
export function StatusPill({ raw, children }: { raw?: string | null; children?: ReactNode }) {
  const key = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  const tone = GREEN.has(key) ? "green" : GOLD.has(key) ? "gold" : "neutral";
  return <Pill tone={tone}>{children ?? raw}</Pill>;
}
