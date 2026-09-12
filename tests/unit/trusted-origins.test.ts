import { describe, expect, it } from "vitest";
import { buildAuthTrustedOrigins } from "@/server/auth/trusted-origins";

describe("buildAuthTrustedOrigins", () => {
  it("includes www and non-www variants for production hosts", () => {
    const origins = buildAuthTrustedOrigins("https://feed.shahkings.com");
    expect(origins).toContain("https://feed.shahkings.com");
    expect(origins).toContain("https://www.feed.shahkings.com");
  });

  it("merges optional extra origins", () => {
    const origins = buildAuthTrustedOrigins(
      "https://feed.shahkings.com",
      "https://admin.example.com",
    );
    expect(origins).toContain("https://admin.example.com");
  });
});
