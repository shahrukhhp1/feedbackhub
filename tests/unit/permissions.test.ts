import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/errors";
import {
  assertPermission,
  canManageApps,
  canManageInbox,
  canManageQuestions,
  canManageTeam,
  canViewAuditLog,
} from "@/server/auth/permissions";

describe("role permissions", () => {
  it("grants app/question/inbox management to superadmin and admin", () => {
    for (const role of ["superadmin", "admin"] as const) {
      expect(canManageApps(role)).toBe(true);
      expect(canManageQuestions(role)).toBe(true);
      expect(canManageInbox(role)).toBe(true);
    }
  });

  it("denies app/question/inbox management to viewer and missing role", () => {
    expect(canManageApps("viewer")).toBe(false);
    expect(canManageQuestions(null)).toBe(false);
    expect(canManageInbox(undefined)).toBe(false);
  });

  it("restricts team and audit log to superadmin only", () => {
    expect(canManageTeam("superadmin")).toBe(true);
    expect(canViewAuditLog("superadmin")).toBe(true);

    expect(canManageTeam("admin")).toBe(false);
    expect(canManageTeam("viewer")).toBe(false);
    expect(canViewAuditLog("admin")).toBe(false);
  });

  it("assertPermission throws ApiError when denied", () => {
    expect(() => assertPermission(false)).toThrow(ApiError);
    expect(() => assertPermission(false, "Nope")).toThrow("Nope");
    expect(() => assertPermission(true)).not.toThrow();
  });
});
