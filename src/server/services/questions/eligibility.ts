import type { QuestionStatus } from "@/shared/constants";

export interface QuestionSchedule {
  status: QuestionStatus | string;
  startsAt: Date | null;
  endsAt: Date | null;
}

export function isQuestionEligible(question: QuestionSchedule, now: Date): boolean {
  if (question.status !== "active") {
    return false;
  }

  if (question.startsAt !== null && question.startsAt > now) {
    return false;
  }

  if (question.endsAt !== null && question.endsAt <= now) {
    return false;
  }

  return true;
}

export function filterEligibleQuestions<T extends QuestionSchedule>(questions: T[], now: Date): T[] {
  return questions.filter((question) => isQuestionEligible(question, now));
}
