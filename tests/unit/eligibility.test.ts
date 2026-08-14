import { describe, expect, it } from "vitest";
import {
  filterEligibleQuestions,
  isQuestionEligible,
  type QuestionSchedule,
} from "@/server/services/questions/eligibility";

const now = new Date("2025-06-15T12:00:00.000Z");

function makeQuestion(overrides: Partial<QuestionSchedule> = {}): QuestionSchedule {
  return {
    status: "active",
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

describe("isQuestionEligible", () => {
  it("returns true for active questions within schedule", () => {
    expect(isQuestionEligible(makeQuestion(), now)).toBe(true);
    expect(
      isQuestionEligible(
        makeQuestion({
          startsAt: new Date("2025-06-15T11:00:00.000Z"),
          endsAt: new Date("2025-06-15T13:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(true);
  });

  it("returns false for non-active statuses", () => {
    expect(isQuestionEligible(makeQuestion({ status: "draft" }), now)).toBe(false);
    expect(isQuestionEligible(makeQuestion({ status: "paused" }), now)).toBe(false);
    expect(isQuestionEligible(makeQuestion({ status: "archived" }), now)).toBe(false);
  });

  it("returns false before start or after end", () => {
    expect(
      isQuestionEligible(makeQuestion({ startsAt: new Date("2025-06-15T13:00:00.000Z") }), now),
    ).toBe(false);
    expect(
      isQuestionEligible(makeQuestion({ endsAt: new Date("2025-06-15T12:00:00.000Z") }), now),
    ).toBe(false);
  });
});

describe("filterEligibleQuestions", () => {
  it("keeps only eligible questions", () => {
    const questions = [
      makeQuestion({ status: "active" }),
      makeQuestion({ status: "draft" }),
      makeQuestion({ endsAt: new Date("2025-06-15T11:00:00.000Z") }),
    ];

    const result = filterEligibleQuestions(questions, now);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("active");
  });
});
