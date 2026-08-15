import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashToken } from "@/server/security/crypto";
import { getInstallationByTokenHash } from "@/server/repositories/installations";
import { disableTeamUser, updateTeamUserRole } from "@/server/services/team.service";
import { revokeAppInstallation } from "@/server/services/apps.service";
import {
  createTestAdminUser,
  createTestApp,
  isTestDatabaseConfigured,
  loginAsAdmin,
  registerTestInstallation,
  resetTestData,
  setupTestDb,
  teardownTestDb,
} from "./helpers";

describe.skipIf(!isTestDatabaseConfigured())("auth", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetTestData();
  });

  it("blocks sign-in for disabled users", async () => {
    const { auth } = await import("@/server/auth");
    const admin = await createTestAdminUser("admin");
    const disabledTarget = await createTestAdminUser("viewer");

    await disableTeamUser(disabledTarget.userId, admin.userId);

    await expect(
      auth.api.signInEmail({
        body: {
          email: disabledTarget.email,
          password: disabledTarget.password,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects revoked installation tokens", async () => {
    const { userId } = await loginAsAdmin();
    const { app, clientKey } = await createTestApp(userId);
    const installation = await registerTestInstallation(app.id, clientKey);

    await revokeAppInstallation(installation.installationId, userId, "superadmin");

    expect(await getInstallationByTokenHash(hashToken(installation.token))).toBeUndefined();
  });

  it("protects the final active superadmin from demotion", async () => {
    const soleSuperadmin = await createTestAdminUser("superadmin");

    await expect(
      updateTeamUserRole(soleSuperadmin.userId, { role: "admin" }, soleSuperadmin.userId),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Cannot modify the final active superadmin",
    });
  });
});
