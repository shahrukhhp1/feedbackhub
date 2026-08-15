import type { AnswerType } from "@/shared/constants";

type StructuredAnswer = {
  type?: AnswerType | string;
  value?: unknown;
};

export function truncateWords(text: string, wordCount = 3): string {
  const trimmed = text.trim();
  if (!trimmed) return "—";
  const words = trimmed.split(/\s+/);
  if (words.length <= wordCount) return trimmed;
  return `${words.slice(0, wordCount).join(" ")}…`;
}

export function formatAnswerValue(answer: unknown): string {
  if (answer === null || answer === undefined) return "—";

  if (typeof answer === "object" && !Array.isArray(answer)) {
    const structured = answer as StructuredAnswer;
    if ("value" in structured) {
      return formatAnswerValue(structured.value);
    }
    if ("type" in structured && !("value" in structured)) {
      return "—";
    }
  }

  if (typeof answer === "string") {
    const trimmed = answer.trim();
    return trimmed || "—";
  }

  if (typeof answer === "boolean") {
    return answer ? "Yes" : "No";
  }

  if (typeof answer === "number") {
    return String(answer);
  }

  if (Array.isArray(answer)) {
    const items = answer
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean);
    return items.length > 0 ? items.join(", ") : "—";
  }

  return "—";
}

export function formatAnswerJson(answer: unknown): string {
  try {
    return JSON.stringify(answer, null, 2);
  } catch {
    return String(answer);
  }
}
