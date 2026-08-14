import { describe, expect, it } from "vitest";
import { validateAnswerContent } from "@/server/validation/answers";
import { MAX_MESSAGE_BODY_LENGTH } from "@/shared/constants";

const choiceOptions = { choices: ["Red", "Blue", "Green"] };

describe("validateAnswerContent", () => {
  it("validates short_text", () => {
    const ok = validateAnswerContent("short_text", "  hello  ");
    expect(ok).toEqual({ ok: true, value: { type: "short_text", value: "hello" } });

    expect(validateAnswerContent("short_text", "")).toMatchObject({ ok: false });
    expect(validateAnswerContent("short_text", "   ")).toMatchObject({ ok: false });
    expect(validateAnswerContent("short_text", "a".repeat(501))).toMatchObject({ ok: false });
  });

  it("validates long_text", () => {
    const ok = validateAnswerContent("long_text", "Detailed feedback");
    expect(ok).toEqual({ ok: true, value: { type: "long_text", value: "Detailed feedback" } });

    expect(validateAnswerContent("long_text", "a".repeat(MAX_MESSAGE_BODY_LENGTH + 1))).toMatchObject({
      ok: false,
    });
  });

  it("validates single_choice", () => {
    const ok = validateAnswerContent("single_choice", "Blue", choiceOptions);
    expect(ok).toEqual({ ok: true, value: { type: "single_choice", value: "Blue" } });

    expect(validateAnswerContent("single_choice", "Yellow", choiceOptions)).toMatchObject({
      ok: false,
    });
    expect(validateAnswerContent("single_choice", "Red", { choices: ["Only"] })).toMatchObject({
      ok: false,
    });
  });

  it("validates multiple_choice", () => {
    const ok = validateAnswerContent("multiple_choice", ["Red", "Blue"], choiceOptions);
    expect(ok).toEqual({ ok: true, value: { type: "multiple_choice", value: ["Red", "Blue"] } });

    expect(validateAnswerContent("multiple_choice", [], choiceOptions)).toMatchObject({ ok: false });
    expect(validateAnswerContent("multiple_choice", ["Red", "Red"], choiceOptions)).toMatchObject({
      ok: false,
    });
    expect(validateAnswerContent("multiple_choice", ["Red", "Yellow"], choiceOptions)).toMatchObject({
      ok: false,
    });
  });

  it("validates rating", () => {
    expect(validateAnswerContent("rating", 3)).toEqual({
      ok: true,
      value: { type: "rating", value: 3 },
    });

    expect(validateAnswerContent("rating", 0)).toMatchObject({ ok: false });
    expect(validateAnswerContent("rating", 6)).toMatchObject({ ok: false });
    expect(validateAnswerContent("rating", 3.5)).toMatchObject({ ok: false });
    expect(validateAnswerContent("rating", "3")).toMatchObject({ ok: false });
  });

  it("validates yes_no", () => {
    expect(validateAnswerContent("yes_no", true)).toEqual({
      ok: true,
      value: { type: "yes_no", value: true },
    });
    expect(validateAnswerContent("yes_no", false)).toEqual({
      ok: true,
      value: { type: "yes_no", value: false },
    });

    expect(validateAnswerContent("yes_no", "yes")).toMatchObject({ ok: false });
  });
});
