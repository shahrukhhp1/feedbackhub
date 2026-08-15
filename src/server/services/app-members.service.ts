import "server-only";

import { ApiError } from "@/server/api/errors";
import {
  createAppMember,
  countAppAdmins,
  deleteAppMember,
  getAppMember,
  listAppMembers,
  updateAppMemberRole,
} from "@/server/repositories/app-members";
import { getAppById } from "@/server/repositories/apps";
import { getUserByEmail, getUserById } from "@/server/repositories/users";
import {
  assertCanAssignAppMembers,
  assertCanViewApp,
  getUserAppRole,
} from "@/server/auth/app-access";
import { normalizeEmail } from "@/server/security/crypto";
import type { AppMemberRole } from "@/shared/constants";
import type { Role } from "@/shared/constants";
import { logAction } from "./audit.service";

export async function listMembersForApp(
  appId: string,
  actorUserId: string,
  globalRole: Role | string,
) {
  await assertCanViewApp(actorUserId, globalRole, appId);
  const app = await getAppById(appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  const members = await listAppMembers(appId);
  const canManageMembers =
    globalRole === "superadmin" ||
    (await getAppMember(appId, actorUserId))?.appRole === "admin";

  return {
    items: members.map((member) => ({
      userId: member.userId,
      email: member.email,
      name: member.name,
      appRole: member.appRole as AppMemberRole,
      createdAt: member.createdAt.toISOString(),
    })),
    canManageMembers,
  };
}

export async function addMemberByEmail(
  appId: string,
  email: string,
  appRole: AppMemberRole,
  actorUserId: string,
  globalRole: Role | string,
  ipAddress?: string,
) {
  await assertCanAssignAppMembers(actorUserId, globalRole, appId);

  const app = await getAppById(appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  const normalizedEmail = normalizeEmail(email);
  const targetUser = await getUserByEmail(normalizedEmail);
  if (!targetUser) {
    throw ApiError.notFound("No user found with that email");
  }
  if (targetUser.disabledAt) {
    throw ApiError.forbidden("User account is disabled");
  }

  const existing = await getAppMember(appId, targetUser.id);
  if (existing) {
    throw ApiError.conflict("User already has access to this app");
  }

  const member = await createAppMember({
    appId,
    userId: targetUser.id,
    appRole,
    createdBy: actorUserId,
  });

  await logAction({
    actorUserId,
    action: "app.member_added",
    entityType: "app",
    entityId: appId,
    metadata: { userId: targetUser.id, appRole },
    ipAddress,
  });

  return {
    userId: member.userId,
    email: targetUser.email,
    name: targetUser.name,
    appRole: member.appRole as AppMemberRole,
    createdAt: member.createdAt.toISOString(),
  };
}

export async function updateMemberRole(
  appId: string,
  userId: string,
  appRole: AppMemberRole,
  actorUserId: string,
  globalRole: Role | string,
  ipAddress?: string,
) {
  await assertCanAssignAppMembers(actorUserId, globalRole, appId);

  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw ApiError.notFound("User not found");
  }

  const existing = await getAppMember(appId, userId);
  if (!existing) {
    throw ApiError.notFound("User is not a member of this app");
  }

  if (existing.appRole === "admin" && appRole === "viewer") {
    const adminCount = await countAppAdmins(appId);
    if (adminCount <= 1) {
      throw ApiError.conflict("Cannot demote the last app admin");
    }
  }

  const member = await updateAppMemberRole(appId, userId, appRole);
  if (!member) {
    throw ApiError.notFound("User is not a member of this app");
  }

  await logAction({
    actorUserId,
    action: "app.member_updated",
    entityType: "app",
    entityId: appId,
    metadata: { userId, appRole },
    ipAddress,
  });

  return {
    userId: member.userId,
    email: targetUser.email,
    name: targetUser.name,
    appRole: member.appRole as AppMemberRole,
    createdAt: member.createdAt.toISOString(),
  };
}

export async function removeMember(
  appId: string,
  userId: string,
  actorUserId: string,
  globalRole: Role | string,
  ipAddress?: string,
) {
  await assertCanAssignAppMembers(actorUserId, globalRole, appId);

  const existing = await getAppMember(appId, userId);
  if (!existing) {
    throw ApiError.notFound("User is not a member of this app");
  }

  if (existing.appRole === "admin") {
    const adminCount = await countAppAdmins(appId);
    if (adminCount <= 1) {
      throw ApiError.conflict("Cannot remove the last app admin");
    }
  }

  const removed = await deleteAppMember(appId, userId);
  if (!removed) {
    throw ApiError.notFound("User is not a member of this app");
  }

  await logAction({
    actorUserId,
    action: "app.member_removed",
    entityType: "app",
    entityId: appId,
    metadata: { userId },
    ipAddress,
  });
}

export async function getAppAccessMeta(
  appId: string,
  actorUserId: string,
  globalRole: Role | string,
) {
  const appRole = await getUserAppRole(actorUserId, globalRole, appId);
  const canManageMembers =
    globalRole === "superadmin" || appRole === "admin";
  const canManageApp = canManageMembers;
  return { appRole, canManageApp, canManageMembers };
}
