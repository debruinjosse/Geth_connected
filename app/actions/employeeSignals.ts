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
    personaTitle: string;
    personaStory: string;
    storyEvidence: string;
    paceConsistent: string;
    paceGrowing: string;
    cardWordSingular: string;
    cardWordPlural: string;
  }
): Promise<EmployeeRecognitionSignal[]> {
  const cardWord = (count: number) => (count === 1 ? labels.cardWordSingular : labels.cardWordPlural);

  return getEmployeeRecognitionSignals(context, {
    emptyTitle: labels.emptyTitle,
    emptyDetail: labels.emptyDetail,
    personaTitle: labels.personaTitle,
    personaStory: labels.personaStory,
    storyEvidence: labels.storyEvidence,
    paceConsistent: labels.paceConsistent,
    paceGrowing: labels.paceGrowing,
    cardWord
  });
}
