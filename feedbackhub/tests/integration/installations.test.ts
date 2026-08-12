import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashToken } from "@/server/security/crypto";
import { getInstallationByTokenHash } from "@/server/repositories/installations";
import { registerInstallation } from "@/server/services/installations.service";
import {
  createTestApp,
  isTestDatabaseConfigured,
  loginAsAdmin,
  registerTestInstallation,
  resetTestData,
  setupTestDb,
  teardownTestDb,
} from "./helpers";

describe.skipIf(!isTestDatabaseConfigured())("installations", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  it("registers a new installation with a valid client key", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const userGuid = randomUUID();

    const result = await registerTestInstallation(app.id, clientKey, userGuid);

    expect(result.installationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.token.length).toBeGreaterThan(10);
    expect(await getInstallationByTokenHash(hashToken(result.token))).toBeDefined();
  });

  it("rotates the installation token when the same user re-registers", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const userGuid = randomUUID();

    const first = await registerTestInstallation(app.id, clientKey, userGuid);
    const second = await registerTestInstallation(app.id, clientKey, userGuid);

    expect(second.installationId).toBe(first.installationId);
    expect(second.token).not.toBe(first.token);
    expect(await getInstallationByTokenHash(hashToken(first.token))).toBeUndefined();
    expect(await getInstallationByTokenHash(hashToken(second.token))).toBeDefined();
  });

  it("stores contact email for website installations", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const userGuid = randomUUID();

    const result = await registerInstallation({
      appId: app.id,
      clientKey,
      userGuid,
      platform: "web",
      contactEmail: "Visitor@Example.com",
    });

    const installation = await getInstallationByTokenHash(hashToken(result.token));
    expect(installation?.contactEmail).toBe("visitor@example.com");
    expect(installation?.platform).toBe("web");
  });

  it("rejects registration with an invalid client key", async () => {
    const { userId } = await loginAsAdmin();
    const { app } = await createTestApp(userId);

    await expect(
      registerInstallation({
        appId: app.id,
        clientKey: "invalid-key",
        userGuid: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
