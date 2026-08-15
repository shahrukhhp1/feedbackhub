import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { appMembers, user } from "@/server/db/schema";
import type { AppMemberRole } from "@/shared/constants";

export type AppMember = typeof appMembers.$inferSelect;
export type NewAppMember = typeof appMembers.$inferInsert;

export type AppMemberWithUser = AppMember & {
  email: string;
  name: string;
};

export async function createAppMember(data: NewAppMember): Promise<AppMember> {
  const [member] = await getDb().insert(appMembers).values(data).returning();
  return member;
}

export async function getAppMember(appId: string, userId: string): Promise<AppMember | undefined> {
  const [member] = await getDb()
    .select()
    .from(appMembers)
    .where(and(eq(appMembers.appId, appId), eq(appMembers.userId, userId)))
    .limit(1);
  return member;
}

export async function listAppMembers(appId: string): Promise<AppMemberWithUser[]> {
  return getDb()
    .select({
      appId: appMembers.appId,
      userId: appMembers.userId,
      appRole: appMembers.appRole,
      createdBy: appMembers.createdBy,
      createdAt: appMembers.createdAt,
      email: user.email,
      name: user.name,
    })
    .from(appMembers)
    .innerJoin(user, eq(appMembers.userId, user.id))
    .where(eq(appMembers.appId, appId))
    .orderBy(user.name);
}

export async function listAppIdsForUser(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ appId: appMembers.appId })
    .from(appMembers)
    .where(eq(appMembers.userId, userId));
  return rows.map((row) => row.appId);
}

export async function updateAppMemberRole(
  appId: string,
  userId: string,
  appRole: AppMemberRole,
): Promise<AppMember | undefined> {
  const [member] = await getDb()
    .update(appMembers)
    .set({ appRole })
    .where(and(eq(appMembers.appId, appId), eq(appMembers.userId, userId)))
    .returning();
  return member;
}

export async function deleteAppMember(appId: string, userId: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(appMembers)
    .where(and(eq(appMembers.appId, appId), eq(appMembers.userId, userId)))
    .returning({ userId: appMembers.userId });
  return deleted.length > 0;
}

export async function countAppAdmins(appId: string): Promise<number> {
  const rows = await getDb()
    .select({ userId: appMembers.userId })
    .from(appMembers)
    .where(and(eq(appMembers.appId, appId), eq(appMembers.appRole, "admin")));
  return rows.length;
}

export async function listAppMembersByAppIds(appIds: string[]): Promise<AppMember[]> {
  if (appIds.length === 0) return [];
  return getDb().select().from(appMembers).where(inArray(appMembers.appId, appIds));
}
