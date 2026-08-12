import { and, desc, eq, gte, lt, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import type { CursorPage } from "./types";

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type ListAuditLogsFilters = {
  cursor?: string;
  limit?: number;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
};

export async function createAuditLog(data: NewAuditLog): Promise<AuditLog> {
  const [log] = await getDb().insert(auditLogs).values(data).returning();
  return log;
}

export async function listAuditLogs(
  filters: ListAuditLogsFilters = {},
): Promise<CursorPage<AuditLog>> {
  const limit = filters.limit ?? 20;
  const conditions = [];

  if (filters.actorUserId) {
    conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
  }
  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters.from) {
    conditions.push(gte(auditLogs.createdAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(auditLogs.createdAt, filters.to));
  }
  if (filters.cursor) {
    conditions.push(lt(auditLogs.id, Number(filters.cursor)));
  }

  const rows = await getDb()
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? String(last.id) : null,
  };
}
