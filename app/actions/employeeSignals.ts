"use server";

import { revalidateTag } from "next/cache";
import {
  getEmployeeRecognitionSignals,
  getEmployeeAiSignalsCacheTag,
  type EmployeeRecognitionSignal,
  type EmployeeSignalsContext
} from "@/lib/ai/employee-recognition-signals";

/**
 * Role: `employee` (caller supplies their own aggregated `context` — this does not fetch data
 * itself). Returns the "growth" coaching insight for the employee's dashboard: a Groq-generated
 * insight when `GROQ_API_KEY` is set (cached 60s per `lib/ai/employee-recognition-signals.ts`),
 * otherwise a static template fallback.
 */
export async function fetchEmployeeRecognitionSignals(
  context: EmployeeSignalsContext,
  labels: {
    emptyTitle: string;
    emptyDetail: string;
    insightTitle: string;
    fallbackInsight: string;
    categoryFallbacks: Record<string, string>;
  }
): Promise<EmployeeRecognitionSignal[]> {
  return getEmployeeRecognitionSignals(context, labels);
}

/** Invalidates the 60s growth/AI-signals cache for one employee (called after a recognition event changes their data). */
export async function refreshEmployeeRecognitionSignals(employeeId: string) {
  revalidateTag(getEmployeeAiSignalsCacheTag(employeeId), "max");
}
