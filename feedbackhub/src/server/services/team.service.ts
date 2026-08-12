import "server-only";

import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { account, session, user } from "@/server/db/schema";
import {
  countActiveSuperadmins,
  createUser,
  disableUser,
  enableUser,
  getUserById,
  listUsers,
  updateUserRole,
} from "@/server/repositories/users";
import { generateTempPassword, normalizeEmail } from "@/server/security/crypto";
import type { CreateTeamUserInput } from "@/server/validation/admin";
import type { Role } from "@/shared/constants";
import { logAction } from "./audit.service";

type UpdateTeamUserRoleInput = { role: Role };

export async function listTeamUsers() {
  return listUsers();
}

export async function createTeamUser(
  input: CreateTeamUserInput,
  actorUserId: string,
  ipAddress?: string,
) {
  const email = normalizeEmail(input.email);
  const db = getDb();

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const userId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: input.name,
      email,
      emailVerified: true,
      role: input.role,
      mustChangePassword: true,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(account).values({
      id: randomUUID(),
      accountId: email,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  });

  const created = await getUserById(userId);
  if (!created) {
    throw ApiError.internal("Failed to create user");
  }

  await logAction({
    actorUserId,
    action: "team.user_created",
    entityType: "user",
    entityId: userId,
    metadata: { email, role: input.role },
    ipAddress,
  });

  return { user: created, temporaryPassword: tempPassword };
}

export async function disableTeamUser(
  userId: string,
  actorUserId: string,
  ipAddress?: string,
) {
  if (userId === actorUserId) {
    throw ApiError.conflict("You cannot disable your own account");
  }

  const target = await getUserById(userId);
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  if (target.disabledAt) {
    throw ApiError.conflict("User is already disabled");
  }

  await assertCanModifySuperadmin(target);

  const updated = await disableUser(userId);
  if (!updated) {
    throw ApiError.notFound("User not found");
  }

  await revokeUserSessions(userId);

  await logAction({
    actorUserId,
    action: "team.user_disabled",
    entityType: "user",
    entityId: userId,
    ipAddress,
  });

  return updated;
}

export async function enableTeamUser(
  userId: string,
  actorUserId: string,
  ipAddress?: string,
) {
  const target = await getUserById(userId);
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  if (!target.disabledAt) {
    throw ApiError.conflict("User is not disabled");
  }

  const updated = await enableUser(userId);
  if (!updated) {
    throw ApiError.notFound("User not found");
  }

  await logAction({
    actorUserId,
    action: "team.user_enabled",
    entityType: "user",
    entityId: userId,
    ipAddress,
  });

  return updated;
}

export async function updateTeamUserRole(
  userId: string,
  input: UpdateTeamUserRoleInput,
  actorUserId: string,
  ipAddress?: string,
) {
  const target = await getUserById(userId);
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  if (target.role === input.role) {
    return target;
  }

  await assertCanModifySuperadmin(target, input.role);

  const updated = await updateUserRole(userId, input.role);
  if (!updated) {
    throw ApiError.notFound("User not found");
  }

  await logAction({
    actorUserId,
    action: "team.role_changed",
    entityType: "user",
    entityId: userId,
    metadata: { role: input.role },
    ipAddress,
  });

  return updated;
}

export async function revokeTeamUserSessions(
  userId: string,
  actorUserId: string,
  ipAddress?: string,
) {
  const target = await getUserById(userId);
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  const revokedCount = await revokeUserSessions(userId);

  await logAction({
    actorUserId,
    action: "team.sessions_revoked",
    entityType: "user",
    entityId: userId,
    metadata: { revokedCount },
    ipAddress,
  });

  return { revokedCount };
}

export async function resetTeamUserPassword(
  userId: string,
  actorUserId: string,
  ipAddress?: string,
) {
  const target = await getUserById(userId);
  if (!target) {
    throw ApiError.notFound("User not found");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const now = new Date();
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(account)
      .set({ password: passwordHash, updatedAt: now })
      .where(eq(account.userId, userId));

    await tx
      .update(user)
      .set({ mustChangePassword: true, updatedAt: now })
      .where(eq(user.id, userId));

    await tx.delete(session).where(eq(session.userId, userId));
  });

  await logAction({
    actorUserId,
    action: "team.password_reset",
    entityType: "user",
    entityId: userId,
    ipAddress,
  });

  return { temporaryPassword: tempPassword };
}

async function revokeUserSessions(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db.delete(session).where(eq(session.userId, userId)).returning({ id: session.id });
  return rows.length;
}

async function assertCanModifySuperadmin(
  target: { id: string; role: string; disabledAt: Date | null },
  nextRole?: Role,
) {
  if (target.role !== "superadmin") {
    return;
  }

  const activeSuperadmins = await countActiveSuperadmins();
  if (activeSuperadmins <= 1 && (!nextRole || nextRole !== "superadmin")) {
    throw ApiError.conflict("Cannot modify the final active superadmin");
  }
}
