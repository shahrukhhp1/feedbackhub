import "server-only";

import { ApiError } from "@/server/errors";
import {
  getAppMember,
  listAppIdsForUser,
} from "@/server/repositories/app-members";
import type { AppMemberRole, Role } from "@/shared/constants";

export function isGlobalSuperadmin(role: Role | string): boolean {
  return role === "superadmin";
}

export async function getAccessibleAppIds(
  userId: string,
  globalRole: Role | string,
): Promise<string[] | null> {
  if (isGlobalSuperadmin(globalRole)) {
    return null;
  }
  return listAppIdsForUser(userId);
}

export async function getUserAppRole(
  userId: string,
  globalRole: Role | string,
  appId: string,
): Promise<AppMemberRole | null> {
  if (isGlobalSuperadmin(globalRole)) {
    return "admin";
  }
  const member = await getAppMember(appId, userId);
  return (member?.appRole as AppMemberRole | undefined) ?? null;
}

export async function assertCanViewApp(
  userId: string,
  globalRole: Role | string,
  appId: string,
): Promise<void> {
  if (isGlobalSuperadmin(globalRole)) return;
  const member = await getAppMember(appId, userId);
  if (!member) {
    throw new ApiError("FORBIDDEN", "You do not have access to this app");
  }
}

export async function assertCanManageApp(
  userId: string,
  globalRole: Role | string,
  appId: string,
): Promise<void> {
  if (isGlobalSuperadmin(globalRole)) return;
  const member = await getAppMember(appId, userId);
  if (!member || member.appRole !== "admin") {
    throw new ApiError("FORBIDDEN", "You do not have permission to manage this app");
  }
}

export async function assertCanAssignAppMembers(
  userId: string,
  globalRole: Role | string,
  appId: string,
): Promise<void> {
  await assertCanManageApp(userId, globalRole, appId);
}

export async function resolveAppIdFilter(
  userId: string,
  globalRole: Role | string,
  requestedAppId?: string,
): Promise<string[] | undefined> {
  const accessible = await getAccessibleAppIds(userId, globalRole);
  if (accessible === null) {
    return requestedAppId ? [requestedAppId] : undefined;
  }
  if (accessible.length === 0) {
    throw new ApiError("FORBIDDEN", "You do not have access to any apps");
  }
  if (requestedAppId) {
    if (!accessible.includes(requestedAppId)) {
      throw new ApiError("FORBIDDEN", "You do not have access to this app");
    }
    return [requestedAppId];
  }
  return accessible;
}
