import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { installations } from "@/server/db/schema";

export type Installation = typeof installations.$inferSelect;
export type NewInstallation = typeof installations.$inferInsert;

export type RegisterInstallationInput = {
  appId: string;
  userGuid: string;
  tokenHash: string;
  contactEmail?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  locale?: string | null;
  timezone?: string | null;
};

export type UpdateLastSeenInput = {
  platform?: string | null;
  appVersion?: string | null;
  locale?: string | null;
  timezone?: string | null;
};

export async function registerOrUpdateInstallation(
  input: RegisterInstallationInput,
): Promise<Installation> {
  const now = new Date();
  const [installation] = await getDb()
    .insert(installations)
    .values({
      appId: input.appId,
      userGuid: input.userGuid,
      contactEmail: input.contactEmail ?? null,
      tokenHash: input.tokenHash,
      platform: input.platform,
      appVersion: input.appVersion,
      locale: input.locale,
      timezone: input.timezone,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: [installations.appId, installations.userGuid],
      set: {
        tokenHash: input.tokenHash,
        ...(input.contactEmail !== undefined && input.contactEmail !== null
          ? { contactEmail: input.contactEmail }
          : {}),
        platform: input.platform,
        appVersion: input.appVersion,
        locale: input.locale,
        timezone: input.timezone,
        lastSeenAt: now,
        revokedAt: null,
      },
    })
    .returning();
  return installation;
}

export async function getInstallationByTokenHash(
  tokenHash: string,
): Promise<Installation | undefined> {
  const [installation] = await getDb()
    .select()
    .from(installations)
    .where(
      and(eq(installations.tokenHash, tokenHash), isNull(installations.revokedAt)),
    )
    .limit(1);
  return installation;
}

export async function getInstallationById(id: string): Promise<Installation | undefined> {
  const [installation] = await getDb()
    .select()
    .from(installations)
    .where(eq(installations.id, id))
    .limit(1);
  return installation;
}

export async function listInstallationsByApp(appId: string): Promise<Installation[]> {
  return getDb()
    .select()
    .from(installations)
    .where(eq(installations.appId, appId))
    .orderBy(desc(installations.lastSeenAt));
}

export async function revokeInstallation(id: string): Promise<Installation | undefined> {
  const [installation] = await getDb()
    .update(installations)
    .set({ revokedAt: new Date() })
    .where(eq(installations.id, id))
    .returning();
  return installation;
}

export async function updateLastSeen(
  id: string,
  metadata?: UpdateLastSeenInput,
): Promise<void> {
  await getDb()
    .update(installations)
    .set({
      lastSeenAt: new Date(),
      ...(metadata?.platform !== undefined ? { platform: metadata.platform } : {}),
      ...(metadata?.appVersion !== undefined ? { appVersion: metadata.appVersion } : {}),
      ...(metadata?.locale !== undefined ? { locale: metadata.locale } : {}),
      ...(metadata?.timezone !== undefined ? { timezone: metadata.timezone } : {}),
    })
    .where(eq(installations.id, id));
}
