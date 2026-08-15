import { vi } from "vitest";
import { adminAuthState } from "./admin-auth-state";
import { isTestDatabaseConfigured, TEST_DATABASE_SKIP_MESSAGE } from "./helpers";
import { resetEnvCache } from "@/server/env";

function bootstrapIntegrationEnv(): void {
  const databaseUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!databaseUrl) return;

  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.DATABASE_URL = databaseUrl;
  process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
  process.env.AUTH_SECRET =
    process.env.AUTH_SECRET ?? "integration-test-auth-secret-32chars";
  resetEnvCache();
}

bootstrapIntegrationEnv();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const headers = new Headers();
    if (adminAuthState.cookie) {
      headers.set("cookie", adminAuthState.cookie);
    }
    return headers;
  }),
}));

if (!isTestDatabaseConfigured()) {
  console.warn(TEST_DATABASE_SKIP_MESSAGE);
}
