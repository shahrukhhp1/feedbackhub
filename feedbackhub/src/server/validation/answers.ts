import type { AnswerType } from "@/shared/constants";
import { MAX_MESSAGE_BODY_LENGTH } from "@/shared/constants";

const MAX_SHORT_TEXT_LENGTH = 500;

export interface QuestionOptions {
  choices: string[];
}

export type ValidatedAnswer =
  | { type: "short_text"; value: string }
  | { type: "long_text"; value: string }
  | { type: "single_choice"; value: string }
  | { type: "multiple_choice"; value: string[] }
  | { type: "rating"; value: number }
  | { type: "yes_no"; value: boolean };

export type AnswerValidationResult =
  | { ok: true; value: ValidatedAnswer }
  | { ok: false; error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeChoices(options: QuestionOptions | null | undefined): string[] {
  return options?.choices.map((choice) => choice.trim()) ?? [];
}

export function validateAnswerContent(
  answerType: AnswerType,
  answer: unknown,
  options?: QuestionOptions | null,
): AnswerValidationResult {
  switch (answerType) {
    case "short_text": {
      if (!isNonEmptyString(answer)) {
        return { ok: false, error: "Short text answer must be a non-empty string" };
      }
      const value = answer.trim();
      if (value.length > MAX_SHORT_TEXT_LENGTH) {
        return {
          ok: false,
          error: `Short text answer must be at most ${MAX_SHORT_TEXT_LENGTH} characters`,
        };
      }
      return { ok: true, value: { type: "short_text", value } };
    }

    case "long_text": {
      if (!isNonEmptyString(answer)) {
        return { ok: false, error: "Long text answer must be a non-empty string" };
      }
      const value = answer.trim();
      if (value.length > MAX_MESSAGE_BODY_LENGTH) {
        return {
          ok: false,
          error: `Long text answer must be at most ${MAX_MESSAGE_BODY_LENGTH} characters`,
        };
      }
      return { ok: true, value: { type: "long_text", value } };
    }

    case "single_choice": {
      const choices = normalizeChoices(options);
      if (choices.length < 2) {
        return { ok: false, error: "Single choice questions require at least two options" };
      }
      if (!isNonEmptyString(answer)) {
        return { ok: false, error: "Single choice answer must be a non-empty string" };
      }
      const value = answer.trim();
      if (!choices.includes(value)) {
        return { ok: false, error: "Answer must match one of the configured choices" };
      }
      return { ok: true, value: { type: "single_choice", value } };
    }

    case "multiple_choice": {
      const choices = normalizeChoices(options);
      if (choices.length < 2) {
        return { ok: false, error: "Multiple choice questions require at least two options" };
      }
      if (!Array.isArray(answer) || answer.length === 0) {
        return { ok: false, error: "Multiple choice answer must be a non-empty array of strings" };
      }
      const value = answer.map((item) => (typeof item === "string" ? item.trim() : ""));
      if (value.some((item) => item.length === 0)) {
        return { ok: false, error: "Multiple choice answers must be non-empty strings" };
      }
      const unique = [...new Set(value)];
      if (unique.length !== value.length) {
        return { ok: false, error: "Multiple choice answers must not contain duplicates" };
      }
      if (unique.some((item) => !choices.includes(item))) {
        return { ok: false, error: "All selected choices must match configured options" };
      }
      return { ok: true, value: { type: "multiple_choice", value: unique } };
    }

    case "rating": {
      if (typeof answer !== "number" || !Number.isInteger(answer)) {
        return { ok: false, error: "Rating answer must be an integer" };
      }
      if (answer < 1 || answer > 5) {
        return { ok: false, error: "Rating must be between 1 and 5" };
      }
      return { ok: true, value: { type: "rating", value: answer } };
    }

    case "yes_no": {
      if (typeof answer !== "boolean") {
        return { ok: false, error: "Yes/no answer must be a boolean" };
      }
      return { ok: true, value: { type: "yes_no", value: answer } };
    }

    default: {
      const _exhaustive: never = answerType;
      return { ok: false, error: `Unsupported answer type: ${String(_exhaustive)}` };
    }
  }
}
