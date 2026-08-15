import { and, desc, eq, gte, ilike, inArray, lt, lte, or } from "drizzle-orm";
import { getDb } from "@/server/db";
import { conversations } from "@/server/db/schema";
import type { ConversationStatus } from "@/shared/constants";
import type { CursorPage, DbOrTransaction } from "./types";

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type ListConversationsFilters = {
  appId?: string;
  appIds?: string[];
  status?: ConversationStatus;
  search?: string;
  cursor?: string;
  limit?: number;
};

function encodeConversationCursor(lastMessageAt: Date, id: string): string {
  return `${lastMessageAt.getTime()}:${id}`;
}

function decodeConversationCursor(cursor: string): { lastMessageAt: Date; id: string } {
  const separatorIndex = cursor.indexOf(":");
  const timestamp = cursor.slice(0, separatorIndex);
  const id = cursor.slice(separatorIndex + 1);
  return { lastMessageAt: new Date(Number(timestamp)), id };
}

type Db = DbOrTransaction;

export async function createConversation(
  data: NewConversation,
  db: Db = getDb(),
): Promise<Conversation> {
  const [conversation] = await db.insert(conversations).values(data).returning();
  return conversation;
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const [conversation] = await getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  return conversation;
}

export async function updateConversationStatus(
  id: string,
  status: ConversationStatus,
  lastMessageAt?: Date,
  db: Db = getDb(),
): Promise<Conversation | undefined> {
  const [conversation] = await db
    .update(conversations)
    .set({
      status,
      lastMessageAt: lastMessageAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id))
    .returning();
  return conversation;
}

async function listConversationsWithFilters(
  filters: ListConversationsFilters,
  installationId?: string,
): Promise<CursorPage<Conversation>> {
  const limit = filters.limit ?? 20;
  const conditions = [];

  if (installationId) {
    conditions.push(eq(conversations.installationId, installationId));
  }
  if (filters.appId) {
    conditions.push(eq(conversations.appId, filters.appId));
  }
  if (filters.appIds) {
    if (filters.appIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    conditions.push(inArray(conversations.appId, filters.appIds));
  }
  if (filters.status) {
    conditions.push(eq(conversations.status, filters.status));
  }
  if (filters.search) {
    conditions.push(ilike(conversations.subject, `%${filters.search}%`));
  }
  if (filters.cursor) {
    const { lastMessageAt, id } = decodeConversationCursor(filters.cursor);
    conditions.push(
      or(
        lt(conversations.lastMessageAt, lastMessageAt),
        and(
          eq(conversations.lastMessageAt, lastMessageAt),
          lt(conversations.id, id),
        ),
      )!,
    );
  }

  const rows = await getDb()
    .select()
    .from(conversations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(conversations.lastMessageAt), desc(conversations.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last
        ? encodeConversationCursor(last.lastMessageAt, last.id)
        : null,
  };
}

export async function listConversations(
  filters: ListConversationsFilters = {},
): Promise<CursorPage<Conversation>> {
  return listConversationsWithFilters(filters);
}

export async function listConversationsForInstallation(
  installationId: string,
  cursor?: string,
  limit?: number,
): Promise<CursorPage<Conversation>> {
  return listConversationsWithFilters({ cursor, limit }, installationId);
}
