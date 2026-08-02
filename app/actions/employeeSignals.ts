"use server";

import {
  getEmployeeRecognitionSignals,
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
