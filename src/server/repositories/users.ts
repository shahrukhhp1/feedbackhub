import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { user } from "@/server/db/schema";
import type { Role } from "@/shared/constants";

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export async function listUsers(): Promise<User[]> {
  return getDb().select().from(user).orderBy(user.name);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [found] = await getDb().select().from(user).where(eq(user.id, id)).limit(1);
  return found;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [found] = await getDb().select().from(user).where(eq(user.email, email)).limit(1);
  return found;
}

export async function createUser(data: NewUser): Promise<User> {
  const [created] = await getDb().insert(user).values(data).returning();
  return created;
}

export async function disableUser(id: string): Promise<User | undefined> {
  const [updated] = await getDb()
    .update(user)
    .set({ disabledAt: new Date(), updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return updated;
}

export async function enableUser(id: string): Promise<User | undefined> {
  const [updated] = await getDb()
    .update(user)
    .set({ disabledAt: null, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return updated;
}

export async function updateUserRole(id: string, role: Role): Promise<User | undefined> {
  const [updated] = await getDb()
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return updated;
}

export async function clearMustChangePassword(id: string): Promise<User | undefined> {
  const [updated] = await getDb()
    .update(user)
    .set({ mustChangePassword: false, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();
  return updated;
}

export async function countActiveSuperadmins(): Promise<number> {
  const rows = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "superadmin"), isNull(user.disabledAt)));
  return rows.length;
}

export async function getAdminUsers(): Promise<User[]> {
  return getDb()
    .select()
    .from(user)
    .where(and(inArray(user.role, ["superadmin", "admin"]), isNull(user.disabledAt)))
    .orderBy(user.name);
}
