import { afterEach, describe, expect, it } from "vitest";
import { resolveCorsOrigin } from "@/server/api/cors";

describe("mobile API CORS", () => {
  const previous = process.env.CORS_ALLOWED_ORIGINS;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = previous;
    }
  });

  it("allows configured origins only", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://a.example.com,https://b.example.com";

    expect(resolveCorsOrigin("https://a.example.com")).toBe("https://a.example.com");
    expect(resolveCorsOrigin("https://evil.example.com")).toBeNull();
    expect(resolveCorsOrigin(null)).toBeNull();
  });
});
