import { describe, expect, it } from "vitest";
import { resolveCorsOrigin } from "@/server/api/cors";

describe("mobile API CORS", () => {
  it("allows any browser origin", () => {
    expect(resolveCorsOrigin("https://any-site.example")).toBe("https://any-site.example");
    expect(resolveCorsOrigin("https://a.example.com/")).toBe("https://a.example.com");
    expect(resolveCorsOrigin(null)).toBeNull();
  });
});
