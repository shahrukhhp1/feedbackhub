import { describe, expect, it } from "vitest";
import { formatAnswerValue, truncateWords } from "@/lib/answer-display";

describe("answer display", () => {
  it("truncates questions to three words", () => {
    expect(truncateWords("How was your checkout experience today")).toBe("How was your…");
    expect(truncateWords("Short")).toBe("Short");
  });

  it("formats structured and raw answers", () => {
    expect(formatAnswerValue({ type: "short_text", value: "hello" })).toBe("hello");
    expect(formatAnswerValue({ type: "multiple_choice", value: ["Red", "Blue"] })).toBe(
      "Red, Blue",
    );
    expect(formatAnswerValue({ type: "yes_no", value: true })).toBe("Yes");
    expect(formatAnswerValue(4)).toBe("4");
    expect(formatAnswerValue("plain text")).toBe("plain text");
  });
});
