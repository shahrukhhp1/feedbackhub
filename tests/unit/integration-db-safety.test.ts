import { describe, expect, it } from "vitest";
import {
  assertSafeIntegrationDatabaseUrl,
  validateIntegrationDatabaseConfig,
} from "../integration/helpers";

describe("integration database safety", () => {
  it("allows localhost", () => {
    expect(() =>
      assertSafeIntegrationDatabaseUrl("postgresql://u:p@localhost:5432/feedback_test"),
    ).not.toThrow();
  });

  it("blocks production-looking remote URLs", () => {
    expect(() =>
      assertSafeIntegrationDatabaseUrl(
        "postgresql://aa0c07_feed:pass@pg8001.site4now.net:6432/db_aa0c07_feed",
      ),
    ).toThrow(/Integration tests refuse/);
  });

  it("rejects TEST_DATABASE_URL identical to production DATABASE_URL snapshot", () => {
    globalThis.__FEEDBACKHUB_INITIAL_DATABASE_URL__ =
      "postgresql://u:p@pg8001.site4now.net:6432/db_aa0c07_feed";
    process.env.TEST_DATABASE_URL =
      "postgresql://u:p@pg8001.site4now.net:6432/db_aa0c07_feed";

    expect(() => validateIntegrationDatabaseConfig()).toThrow(/Integration tests refuse/);

    delete process.env.TEST_DATABASE_URL;
    delete globalThis.__FEEDBACKHUB_INITIAL_DATABASE_URL__;
  });

  it("allows CI-style same URL when local test database name", () => {
    const url = "postgresql://test:test@localhost:5432/feedback_test";
    globalThis.__FEEDBACKHUB_INITIAL_DATABASE_URL__ = url;
    process.env.TEST_DATABASE_URL = url;

    expect(validateIntegrationDatabaseConfig()).toBe(url);

    delete process.env.TEST_DATABASE_URL;
    delete globalThis.__FEEDBACKHUB_INITIAL_DATABASE_URL__;
  });
});
