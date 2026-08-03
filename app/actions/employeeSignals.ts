"use server";

import { revalidateTag } from "next/cache";
import {
  getEmployeeRecognitionSignals,
  getEmployeeAiSignalsCacheTag,
  type EmployeeRecognitionSignal,
  type EmployeeSignalsContext
} from "@/lib/ai/employee-recognition-signals";

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

export async function refreshEmployeeRecognitionSignals(employeeId: string) {
  revalidateTag(getEmployeeAiSignalsCacheTag(employeeId), "max");
}
