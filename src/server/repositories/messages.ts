import { and, asc, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { getDb } from "@/server/db";
import { conversations, messages } from "@/server/db/schema";
import { SYNC_REPLY_LIMIT } from "@/shared/constants";
import type { CursorPage, DbOrTransaction } from "./types";

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type AcknowledgeMessagesInput = {
  installationId: string;
  deliveredMessageIds?: string[];
  readMessageIds?: string[];
};

type Db = DbOrTransaction;

export async function createMessage(data: NewMessage, db: Db = getDb()): Promise<Message> {
  const [message] = await db.insert(messages).values(data).returning();
  return message;
}

export async function getMessageByInstallationClientRequestId(
  installationId: string,
  clientRequestId: string,
): Promise<{ message: Message; conversationId: string } | undefined> {
  const [row] = await getDb()
    .select({
      message: messages,
      conversationId: messages.conversationId,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.installationId, installationId),
        eq(messages.clientRequestId, clientRequestId),
      ),
    )
    .limit(1);

  if (!row) return undefined;
  return { message: row.message, conversationId: row.conversationId };
}

export async function getMessageByClientRequestId(
  conversationId: string,
  clientRequestId: string,
  db: Db = getDb(),
): Promise<Message | undefined> {
  const [message] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.clientRequestId, clientRequestId),
      ),
    )
    .limit(1);
  return message;
}

export async function getMessagesAfterSequence(
  installationId: string,
  afterSequence: number,
  limit: number = SYNC_REPLY_LIMIT,
): Promise<Message[]> {
  return getDb()
    .select({
      id: messages.id,
      sequence: messages.sequence,
      conversationId: messages.conversationId,
      senderType: messages.senderType,
      adminUserId: messages.adminUserId,
      body: messages.body,
      clientRequestId: messages.clientRequestId,
      deliveredAt: messages.deliveredAt,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.installationId, installationId),
        gt(messages.sequence, afterSequence),
        inArray(messages.senderType, ["admin", "system"]),
      ),
    )
    .orderBy(asc(messages.sequence))
    .limit(limit);
}

export async function getMessagesForConversation(
  conversationId: string,
  before?: number,
  limit: number = 50,
): Promise<CursorPage<Message>> {
  const conditions = [eq(messages.conversationId, conversationId)];
  if (before !== undefined) {
    conditions.push(lt(messages.sequence, before));
  }

  const rows = await getDb()
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.sequence))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = [...page].reverse();
  const oldest = page.at(-1);

  return {
    items,
    nextCursor: hasMore && oldest ? String(oldest.sequence) : null,
  };
}

export async function acknowledgeMessages(input: AcknowledgeMessagesInput): Promise<void> {
  const db = getDb();
  const now = new Date();

  const installationConversationIds = db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.installationId, input.installationId));

  if (input.deliveredMessageIds?.length) {
    await db
      .update(messages)
      .set({ deliveredAt: now })
      .where(
        and(
          inArray(messages.id, input.deliveredMessageIds),
          inArray(messages.conversationId, installationConversationIds),
        ),
      );
  }

  if (input.readMessageIds?.length) {
    await db
      .update(messages)
      .set({ readAt: now })
      .where(
        and(
          inArray(messages.id, input.readMessageIds),
          inArray(messages.conversationId, installationConversationIds),
        ),
      );
  }
}
