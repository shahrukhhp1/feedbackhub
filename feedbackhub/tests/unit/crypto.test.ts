import { describe, expect, it } from "vitest";
import {
  generateClientKey,
  hashToken,
  verifyClientKey,
  verifyTokenHash,
} from "@/server/security/crypto";

describe("crypto utilities", () => {
  it("hashes tokens deterministically", () => {
    const token = "test-token-value";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("verifies client keys with timing-safe comparison", () => {
    const key = generateClientKey();

    expect(verifyClientKey(key, key)).toBe(true);
    expect(verifyClientKey("wrong-key", key)).toBe(false);
  });

  it("verifies token hashes with timing-safe comparison", () => {
    const token = "secret-installation-token";
    const hash = hashToken(token);

    expect(verifyTokenHash(token, hash)).toBe(true);
    expect(verifyTokenHash("wrong-token", hash)).toBe(false);
    expect(verifyTokenHash(token, "00".repeat(32))).toBe(false);
  });

  it("generates unique client keys with fh_ prefix", () => {
    const first = generateClientKey();
    const second = generateClientKey();

    expect(first).toMatch(/^fh_/);
    expect(first).not.toBe(second);
  });
});
