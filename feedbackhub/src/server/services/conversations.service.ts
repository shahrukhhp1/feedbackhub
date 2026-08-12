import "server-only";

import { eq } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { conversations } from "@/server/db/schema";
import {
  createConversation,
  getConversation,
  listConversationsForInstallation,
  updateConversationStatus,
} from "@/server/repositories/conversations";
import type { Installation } from "@/server/repositories/installations";
import {
  createMessage,
  getMessageByClientRequestId,
  getMessageByInstallationClientRequestId,
  getMessagesForConversation,
} from "@/server/repositories/messages";
import type { CreateConversationInput, AddMessageInput } from "@/server/validation/mobile";
import { transitionConversationStatus } from "./conversations/status";
import { logAction } from "./audit.service";

export type CreateFeedbackResult = {
  conversationId: string;
  messageId: string;
};

export async function createFeedback(
  installation: Installation,
  input: CreateConversationInput,
): Promise<CreateFeedbackResult> {
  const existing = await getMessageByInstallationClientRequestId(
    installation.id,
    input.clientRequestId,
  );
  if (existing) {
    return {
      conversationId: existing.conversationId,
      messageId: existing.message.id,
    };
  }

  return getDb().transaction(async (tx) => {
    const conversation = await createConversation(
      {
        appId: installation.appId,
        installationId: installation.id,
        sourceType: "general_feedback",
        subject: input.subject,
        status: "open",
        lastMessageAt: new Date(),
      },
      tx,
    );

    const message = await createMessage(
      {
        conversationId: conversation.id,
        senderType: "mobile_user",
        body: input.message,
        clientRequestId: input.clientRequestId,
      },
      tx,
    );

    return {
      conversationId: conversation.id,
      messageId: message.id,
    };
  });
}

export async function addMobileMessage(
  installation: Installation,
  conversationId: string,
  input: AddMessageInput,
): Promise<{ messageId: string }> {
  const conversation = await getConversationForInstallation(installation, conversationId);

  const existing = await getMessageByClientRequestId(conversationId, input.clientRequestId);
  if (existing) {
    return { messageId: existing.id };
  }

  const now = new Date();
  const nextStatus = transitionConversationStatus(conversation.status as "open" | "waiting_for_user" | "closed", {
    type: "mobile_message",
  });

  return getDb().transaction(async (tx) => {
    const message = await createMessage(
      {
        conversationId,
        senderType: "mobile_user",
        body: input.body,
        clientRequestId: input.clientRequestId,
      },
      tx,
    );

    if (nextStatus) {
      await updateConversationStatus(conversationId, nextStatus, now, tx);
    }

    return { messageId: message.id };
  });
}

export async function adminReply(
  conversationId: string,
  body: string,
  adminUserId: string,
  ipAddress?: string,
): Promise<{ messageId: string }> {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  if (conversation.status === "closed") {
    throw ApiError.conflict("Conversation is closed");
  }

  const now = new Date();
  const nextStatus = transitionConversationStatus(
    conversation.status as "open" | "waiting_for_user" | "closed",
    { type: "admin_reply" },
  );

  const message = await createMessage({
    conversationId,
    senderType: "admin",
    adminUserId,
    body,
  });

  if (nextStatus) {
    await updateConversationStatus(conversationId, nextStatus, now);
  }

  await logAction({
    actorUserId: adminUserId,
    action: "conversation.reply",
    entityType: "conversation",
    entityId: conversationId,
    ipAddress,
  });

  return { messageId: message.id };
}

export async function closeConversation(
  conversationId: string,
  adminUserId: string,
  ipAddress?: string,
): Promise<void> {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  const nextStatus = transitionConversationStatus(
    conversation.status as "open" | "waiting_for_user" | "closed",
    { type: "admin_close" },
  );
  if (!nextStatus) {
    throw ApiError.conflict("Conversation is already closed");
  }

  await updateConversationStatus(conversationId, nextStatus);

  await logAction({
    actorUserId: adminUserId,
    action: "conversation.close",
    entityType: "conversation",
    entityId: conversationId,
    ipAddress,
  });
}

export async function reopenConversation(
  conversationId: string,
  adminUserId: string,
  ipAddress?: string,
): Promise<void> {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  const nextStatus = transitionConversationStatus(
    conversation.status as "open" | "waiting_for_user" | "closed",
    { type: "admin_reopen" },
  );
  if (!nextStatus) {
    throw ApiError.conflict("Conversation is not closed");
  }

  await updateConversationStatus(conversationId, nextStatus);

  await logAction({
    actorUserId: adminUserId,
    action: "conversation.reopen",
    entityType: "conversation",
    entityId: conversationId,
    ipAddress,
  });
}

export async function listInstallationConversations(
  installationId: string,
  cursor?: string,
  limit?: number,
) {
  const page = await listConversationsForInstallation(installationId, cursor, limit);
  return {
    items: page.items.map((conversation) => ({
      id: conversation.id,
      subject: conversation.subject,
      status: conversation.status,
      sourceType: conversation.sourceType,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
    })),
    nextCursor: page.nextCursor,
    hasMore: page.nextCursor !== null,
  };
}

export async function listConversationMessages(
  installation: Installation,
  conversationId: string,
  before?: number,
  limit?: number,
) {
  await getConversationForInstallation(installation, conversationId);
  const page = await getMessagesForConversation(conversationId, before, limit);
  return {
    items: page.items.map((message) => ({
      id: message.id,
      sequence: message.sequence,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
    nextCursor: page.nextCursor,
    hasMore: page.nextCursor !== null,
  };
}

async function getConversationForInstallation(installation: Installation, conversationId: string) {
  const conversation = await getConversation(conversationId);
  if (!conversation || conversation.installationId !== installation.id) {
    throw ApiError.notFound("Conversation not found");
  }
  return conversation;
}

export async function findConversationByAnswerId(answerId: string) {
  const [conversation] = await getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.answerId, answerId))
    .limit(1);
  return conversation;
}
