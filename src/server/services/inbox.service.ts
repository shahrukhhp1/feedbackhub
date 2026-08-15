import "server-only";

import { eq } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { assertCanManageApp, assertCanViewApp } from "@/server/auth/app-access";
import { getDb } from "@/server/db";
import { conversations, messages } from "@/server/db/schema";
import { getAnswerById } from "@/server/repositories/answers";
import {
  getConversation,
  listConversations,
  updateConversationStatus,
} from "@/server/repositories/conversations";
import { getInstallationById } from "@/server/repositories/installations";
import { getMessagesForConversation } from "@/server/repositories/messages";
import { transitionConversationStatus } from "@/server/services/conversations/status";
import type { ConversationStatus, Role } from "@/shared/constants";
import type { InboxListQuery, AdminReplyInput } from "@/server/validation/admin";
import { resolveAccessibleAppIdsForActor } from "./apps.service";
import { logAction } from "./audit.service";

export async function listInboxConversations(
  actorUserId: string,
  actorRole: Role | string,
  query: InboxListQuery,
) {
  const appIds = await resolveAccessibleAppIdsForActor(actorUserId, actorRole, query.appId);
  const page = await listConversations({
    status: query.status,
    search: query.search,
    cursor: query.cursor,
    limit: query.limit,
    appIds,
  });

  return {
    items: page.items,
    nextCursor: page.nextCursor,
    hasMore: page.nextCursor !== null,
  };
}

export async function getInboxConversationDetail(
  conversationId: string,
  actorUserId: string,
  actorRole: Role | string,
) {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }
  await assertCanViewApp(actorUserId, actorRole, conversation.appId);

  const [installation, answer, messagePage] = await Promise.all([
    getInstallationById(conversation.installationId),
    conversation.answerId ? getAnswerById(conversation.answerId) : Promise.resolve(undefined),
    getMessagesForConversation(conversationId),
  ]);

  return {
    conversation,
    installation,
    answer,
    messages: messagePage.items,
    messagesNextCursor: messagePage.nextCursor,
  };
}

export async function replyToConversation(
  conversationId: string,
  input: AdminReplyInput,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }
  await assertCanManageApp(actorUserId, actorRole, conversation.appId);

  if (conversation.status === "closed") {
    throw ApiError.conflict("Cannot reply to a closed conversation");
  }

  const nextStatus = transitionConversationStatus(
    conversation.status as ConversationStatus,
    { type: "admin_reply" },
  );
  if (!nextStatus) {
    throw ApiError.conflict("Cannot reply to this conversation");
  }

  const db = getDb();
  const message = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderType: "admin",
        adminUserId: actorUserId,
        body: input.body,
      })
      .returning();

    await tx
      .update(conversations)
      .set({
        status: nextStatus,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return created;
  });

  await logAction({
    actorUserId,
    action: "inbox.reply",
    entityType: "conversation",
    entityId: conversationId,
    metadata: { messageId: message.id },
    ipAddress,
  });

  return message;
}

export async function closeConversation(
  conversationId: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  return setConversationStatus(
    conversationId,
    { type: "admin_close" },
    "inbox.closed",
    actorUserId,
    actorRole,
    ipAddress,
  );
}

export async function reopenConversation(
  conversationId: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  return setConversationStatus(
    conversationId,
    { type: "admin_reopen" },
    "inbox.reopened",
    actorUserId,
    actorRole,
    ipAddress,
  );
}

async function setConversationStatus(
  conversationId: string,
  event: Parameters<typeof transitionConversationStatus>[1],
  auditAction: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }
  await assertCanManageApp(actorUserId, actorRole, conversation.appId);

  const nextStatus = transitionConversationStatus(
    conversation.status as ConversationStatus,
    event,
  );
  if (!nextStatus) {
    throw ApiError.conflict("Conversation status cannot be changed");
  }

  const updated = await updateConversationStatus(conversationId, nextStatus);
  if (!updated) {
    throw ApiError.notFound("Conversation not found");
  }

  await logAction({
    actorUserId,
    action: auditAction,
    entityType: "conversation",
    entityId: conversationId,
    metadata: { status: nextStatus },
    ipAddress,
  });

  return updated;
}
