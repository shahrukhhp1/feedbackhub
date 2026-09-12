import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { closeDb, getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import { account, user } from "@/server/db/schema";
import { resetEnvCache } from "@/server/env";
import { registerInstallation } from "@/server/services/installations.service";
import { createAppWithKey } from "@/server/services/apps.service";
import type { Role } from "@/shared/constants";

export const TEST_DATABASE_SKIP_MESSAGE =
  "Skipping integration tests: set TEST_DATABASE_URL to a dedicated Postgres database (never production).";

const INTEGRATION_TEST_ALLOW_REMOTE = "INTEGRATION_TEST_ALLOW_REMOTE_DATABASE";

function getInitialDatabaseUrl(): string | undefined {
  return globalThis.__FEEDBACKHUB_INITIAL_DATABASE_URL__;
}

function parsePostgresUrl(connectionString: string): { hostname: string; database: string } {
  const parsed = new URL(connectionString.replace(/^postgresql:/i, "http:"));
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "") || "");
  return { hostname: parsed.hostname.toLowerCase(), database };
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function looksLikeTestDatabaseName(database: string): boolean {
  return /(_test|test)/i.test(database);
}

/** Refuse remote/production-looking URLs unless explicitly allowed. */
export function assertSafeIntegrationDatabaseUrl(connectionString: string): void {
  const { hostname, database } = parsePostgresUrl(connectionString);

  if (isLocalHostname(hostname)) {
    return;
  }

  if (process.env[INTEGRATION_TEST_ALLOW_REMOTE] === "1" && /_test$/i.test(database)) {
    return;
  }

  throw new Error(
    `Integration tests refuse to use ${hostname}/${database}. ` +
      `Use a local Postgres URL, or a remote database whose name ends with _test and set ${INTEGRATION_TEST_ALLOW_REMOTE}=1.`,
  );
}

/** Validates TEST_DATABASE_URL; throws if it could target production. */
export function validateIntegrationDatabaseConfig(): string {
  const url = process.env.TEST_DATABASE_URL?.trim();
  if (!url) {
    throw new Error(TEST_DATABASE_SKIP_MESSAGE);
  }

  assertSafeIntegrationDatabaseUrl(url);

  const initial = getInitialDatabaseUrl();
  if (initial && initial === url) {
    const { hostname, database } = parsePostgresUrl(url);
    if (!(isLocalHostname(hostname) && looksLikeTestDatabaseName(database))) {
      throw new Error(
        "TEST_DATABASE_URL must not be the same connection string as DATABASE_URL from .env unless it is a local database whose name clearly indicates test (e.g. feedbackhub_test).",
      );
    }
  }

  return url;
}

export function isTestDatabaseConfigured(): boolean {
  return Boolean(process.env.TEST_DATABASE_URL?.trim());
}

function configureTestEnv(databaseUrl: string): void {
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.DATABASE_URL = databaseUrl;
  process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
  process.env.AUTH_SECRET =
    process.env.AUTH_SECRET ?? "integration-test-auth-secret-32chars";
  resetEnvCache();
}

async function ensureDatabaseSchema(databaseUrl: string): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  if (existsSync(journalPath)) {
    await migrate(db, { migrationsFolder });
  } else {
    const { pushSchema } = await import("drizzle-kit/api");
    const { apply } = await pushSchema(schema, db as never);
    await apply();
  }

  await client.end();
}

export async function setupTestDb(): Promise<void> {
  const databaseUrl = validateIntegrationDatabaseConfig();
  configureTestEnv(databaseUrl);
  await closeDb();
  await ensureDatabaseSchema(databaseUrl);
  getDb();
}

export async function teardownTestDb(): Promise<void> {
  await closeDb();
  resetEnvCache();
}

export async function createTestAdminUser(role: Role = "superadmin") {
  const email = `admin-${randomUUID()}@test.local`;
  const password = "TestPassword123!";
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const now = new Date();
  const db = getDb();

  await db.insert(user).values({
    id: userId,
    name: "Test Admin",
    email,
    emailVerified: true,
    role,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(account).values({
    id: randomUUID(),
    accountId: email,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return { userId, email, password, role };
}

export async function loginAsAdmin(
  credentials?: { email: string; password: string; userId: string; role?: Role },
) {
  const { auth } = await import("@/server/auth");
  const creds = credentials ?? (await createTestAdminUser("superadmin"));
  const session = await auth.api.signInEmail({
    body: {
      email: creds.email,
      password: creds.password,
    },
  });

  if (!session) {
    throw new Error("Failed to sign in test admin user");
  }

  return {
    userId: creds.userId,
    email: creds.email,
    password: creds.password,
    role: "role" in creds ? creds.role : undefined,
    session,
  };
}

export async function createTestApp(actorUserId: string, slug = `test-${randomUUID().slice(0, 8)}`) {
  const { app, clientKey } = await createAppWithKey(
    {
      name: "Test App",
      slug,
      status: "active",
    },
    actorUserId,
    "superadmin",
  );

  return { app, clientKey };
}

export async function registerTestInstallation(
  appId: string,
  clientKey: string,
  userGuid: string = randomUUID(),
) {
  return registerInstallation({
    appId,
    clientKey,
    userGuid,
    platform: "ios",
    appVersion: "1.0.0",
    locale: "en-US",
    timezone: "UTC",
  });
}
