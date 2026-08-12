import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
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
  "Skipping integration tests: set TEST_DATABASE_URL to a Postgres connection string.";

export function isTestDatabaseConfigured(): boolean {
  return Boolean(process.env.TEST_DATABASE_URL?.trim());
}

function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(TEST_DATABASE_SKIP_MESSAGE);
  }
  return url;
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
  const databaseUrl = getTestDatabaseUrl();
  configureTestEnv(databaseUrl);
  await closeDb();
  await ensureDatabaseSchema(databaseUrl);
  getDb();
  await resetTestData();
}

export async function teardownTestDb(): Promise<void> {
  await closeDb();
  resetEnvCache();
}

export async function resetTestData(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    TRUNCATE TABLE
      audit_logs,
      question_dismissals,
      messages,
      conversations,
      answers,
      questions,
      installations,
      apps,
      verification,
      session,
      account,
      "user"
    RESTART IDENTITY CASCADE
  `);
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
