import { and, desc, eq, lt, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { apps } from "@/server/db/schema";
import type { CursorPage } from "./types";

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;

export type AppPublic = App;

const publicAppColumns = {
  id: apps.id,
  name: apps.name,
  slug: apps.slug,
  clientKey: apps.clientKey,
  status: apps.status,
  createdBy: apps.createdBy,
  createdAt: apps.createdAt,
  updatedAt: apps.updatedAt,
};

export async function createApp(data: NewApp): Promise<App> {
  const [app] = await getDb().insert(apps).values(data).returning();
  return app;
}

export async function getAppById(id: string): Promise<AppPublic | undefined> {
  const [app] = await getDb()
    .select(publicAppColumns)
    .from(apps)
    .where(eq(apps.id, id))
    .limit(1);
  return app;
}

export async function listApps(): Promise<AppPublic[]> {
  return getDb().select(publicAppColumns).from(apps).orderBy(apps.name);
}

export type ListAppsFilters = {
  status?: string;
  cursor?: string;
  limit?: number;
};

function encodeAppCursor(updatedAt: Date, id: string): string {
  return `${updatedAt.getTime()}:${id}`;
}

function decodeAppCursor(cursor: string): { updatedAt: Date; id: string } {
  const separatorIndex = cursor.indexOf(":");
  return {
    updatedAt: new Date(Number(cursor.slice(0, separatorIndex))),
    id: cursor.slice(separatorIndex + 1),
  };
}

export async function getAppBySlug(slug: string): Promise<AppPublic | undefined> {
  const [app] = await getDb()
    .select(publicAppColumns)
    .from(apps)
    .where(eq(apps.slug, slug))
    .limit(1);
  return app;
}

export async function listAppsPaginated(
  filters: ListAppsFilters = {},
): Promise<CursorPage<AppPublic>> {
  const limit = filters.limit ?? 20;
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(apps.status, filters.status));
  }
  if (filters.cursor) {
    const { updatedAt, id } = decodeAppCursor(filters.cursor);
    conditions.push(
      or(
        lt(apps.updatedAt, updatedAt),
        and(eq(apps.updatedAt, updatedAt), lt(apps.id, id)),
      )!,
    );
  }

  const rows = await getDb()
    .select(publicAppColumns)
    .from(apps)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(apps.updatedAt), desc(apps.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? encodeAppCursor(last.updatedAt, last.id) : null,
  };
}

export async function updateApp(
  id: string,
  data: Partial<Pick<App, "name" | "slug" | "status">>,
): Promise<AppPublic | undefined> {
  const [app] = await getDb()
    .update(apps)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(apps.id, id))
    .returning(publicAppColumns);
  return app;
}

export async function deactivateApp(id: string): Promise<AppPublic | undefined> {
  const [app] = await getDb()
    .update(apps)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(apps.id, id))
    .returning(publicAppColumns);
  return app;
}

export async function rotateClientKey(
  id: string,
  clientKey: string,
): Promise<AppPublic | undefined> {
  const [app] = await getDb()
    .update(apps)
    .set({ clientKey, updatedAt: new Date() })
    .where(eq(apps.id, id))
    .returning(publicAppColumns);
  return app;
}

export async function getAppByIdForAuth(id: string): Promise<App | undefined> {
  const [app] = await getDb().select().from(apps).where(eq(apps.id, id)).limit(1);
  return app;
}
