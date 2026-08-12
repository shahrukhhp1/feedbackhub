import "server-only";

import type { Role } from "@/shared/constants";
import { ApiError } from "@/server/errors";

function isSuperadmin(role: Role | string): boolean {
  return role === "superadmin";
}

function isAdmin(role: Role | string): boolean {
  return role === "admin";
}

export function canManageApps(role: Role | string | null | undefined): boolean {
  return isSuperadmin(role ?? "") || isAdmin(role ?? "");
}

export function canManageQuestions(role: Role | string | null | undefined): boolean {
  return isSuperadmin(role ?? "") || isAdmin(role ?? "");
}

export function canManageInbox(role: Role | string | null | undefined): boolean {
  return isSuperadmin(role ?? "") || isAdmin(role ?? "");
}

export function canManageTeam(role: Role | string | null | undefined): boolean {
  return isSuperadmin(role ?? "");
}

export function canViewAuditLog(role: Role | string | null | undefined): boolean {
  return isSuperadmin(role ?? "");
}

export function assertPermission(
  allowed: boolean,
  message = "Insufficient permissions",
): asserts allowed {
  if (!allowed) {
    throw new ApiError("FORBIDDEN", message);
  }
}
