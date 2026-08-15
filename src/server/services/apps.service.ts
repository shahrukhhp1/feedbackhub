import "server-only";

import { ApiError } from "@/server/api/errors";
import {
  assertCanManageApp,
  assertCanViewApp,
  getAccessibleAppIds,
  resolveAppIdFilter,
} from "@/server/auth/app-access";
import { createAppMember } from "@/server/repositories/app-members";
import {
  createApp,
  getAppById,
  getAppBySlug,
  listAppsPaginated,
  rotateClientKey,
  updateApp,
} from "@/server/repositories/apps";
import {
  getInstallationById,
  listInstallationsByApp,
  revokeInstallation,
} from "@/server/repositories/installations";
import { generateClientKey } from "@/server/security/crypto";
import type { Role } from "@/shared/constants";
import type { CreateAppInput, UpdateAppInput } from "@/server/validation/admin";
import { getAppAccessMeta } from "./app-members.service";
import { logAction } from "./audit.service";

export async function createAppWithKey(
  input: CreateAppInput,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const existing = await getAppBySlug(input.slug);
  if (existing) {
    throw ApiError.conflict("An app with this slug already exists");
  }

  const clientKey = generateClientKey();
  const app = await createApp({
    name: input.name,
    slug: input.slug,
    status: input.status,
    clientKey,
    createdBy: actorUserId,
  });

  await createAppMember({
    appId: app.id,
    userId: actorUserId,
    appRole: "admin",
    createdBy: actorUserId,
  });

  await logAction({
    actorUserId,
    action: "app.created",
    entityType: "app",
    entityId: app.id,
    metadata: { slug: app.slug },
    ipAddress,
  });

  return { app, clientKey };
}

export async function listApps(
  actorUserId: string,
  actorRole: Role | string,
  filters: {
    status?: string;
    cursor?: string;
    limit?: number;
  },
) {
  const accessible = await getAccessibleAppIds(actorUserId, actorRole);
  const page = await listAppsPaginated({
    ...filters,
    appIds: accessible === null ? undefined : accessible,
  });
  return {
    items: page.items,
    nextCursor: page.nextCursor,
    hasMore: page.nextCursor !== null,
  };
}

export async function getApp(
  appId: string,
  actorUserId: string,
  actorRole: Role | string,
) {
  await assertCanViewApp(actorUserId, actorRole, appId);
  const app = await getAppById(appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }
  const access = await getAppAccessMeta(appId, actorUserId, actorRole);
  return { ...app, access };
}

export async function updateAppDetails(
  appId: string,
  input: UpdateAppInput,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  await assertCanManageApp(actorUserId, actorRole, appId);
  const existing = await getAppById(appId);
  if (!existing) {
    throw ApiError.notFound("App not found");
  }

  const app = await updateApp(appId, input);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  await logAction({
    actorUserId,
    action: "app.updated",
    entityType: "app",
    entityId: app.id,
    metadata: input,
    ipAddress,
  });

  return app;
}

export async function rotateAppClientKey(
  appId: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  await assertCanManageApp(actorUserId, actorRole, appId);
  const existing = await getAppById(appId);
  if (!existing) {
    throw ApiError.notFound("App not found");
  }

  const clientKey = generateClientKey();
  const app = await rotateClientKey(appId, clientKey);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  await logAction({
    actorUserId,
    action: "app.key_rotated",
    entityType: "app",
    entityId: app.id,
    ipAddress,
  });

  return { app, clientKey };
}

export async function listAppInstallations(
  appId: string,
  actorUserId: string,
  actorRole: Role | string,
  options: { includeRevoked?: boolean } = {},
) {
  await assertCanViewApp(actorUserId, actorRole, appId);
  const app = await getAppById(appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  const installations = await listInstallationsByApp(appId);
  if (options.includeRevoked) {
    return installations;
  }

  return installations.filter((installation) => installation.revokedAt === null);
}

export async function revokeAppInstallation(
  installationId: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw ApiError.notFound("Installation not found");
  }

  await assertCanManageApp(actorUserId, actorRole, installation.appId);

  if (installation.revokedAt) {
    throw ApiError.conflict("Installation is already revoked");
  }

  const revoked = await revokeInstallation(installationId);
  if (!revoked) {
    throw ApiError.notFound("Installation not found");
  }

  await logAction({
    actorUserId,
    action: "installation.revoked",
    entityType: "installation",
    entityId: installationId,
    metadata: { appId: installation.appId },
    ipAddress,
  });

  return revoked;
}

export async function resolveAccessibleAppIdsForActor(
  actorUserId: string,
  actorRole: Role | string,
  requestedAppId?: string,
): Promise<string[] | undefined> {
  const ids = await resolveAppIdFilter(actorUserId, actorRole, requestedAppId);
  return ids;
}
