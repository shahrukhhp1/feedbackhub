import "server-only";

import { updateLastSeen, type Installation } from "@/server/repositories/installations";
import { getMessagesAfterSequence } from "@/server/repositories/messages";
import { getActiveQuestionsForSync } from "@/server/repositories/questions";
import type { SyncResponse } from "@/shared/contracts/api";
import { SYNC_REPLY_LIMIT } from "@/shared/constants";

function toPublicQuestion(question: Awaited<ReturnType<typeof getActiveQuestionsForSync>>[number]) {
  return {
    id: question.id,
    title: question.title,
    description: question.description,
    answerType: question.answerType,
    options: question.options,
    required: question.required,
  };
}

function toPublicReply(message: Awaited<ReturnType<typeof getMessagesAfterSequence>>[number]) {
  return {
    id: message.id,
    sequence: message.sequence,
    conversationId: message.conversationId,
    senderType: message.senderType,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function getSyncData(
  installation: Installation,
  afterCursor: number,
): Promise<SyncResponse> {
  const [questions, replies] = await Promise.all([
    getActiveQuestionsForSync(installation.appId, installation.id),
    getMessagesAfterSequence(installation.id, afterCursor, SYNC_REPLY_LIMIT),
  ]);

  updateLastSeen(installation.id, {
    platform: installation.platform,
    appVersion: installation.appVersion,
    locale: installation.locale,
    timezone: installation.timezone,
  }).catch(() => {});

  const hasMore = replies.length === SYNC_REPLY_LIMIT;
  const lastReply = replies.at(-1);
  const nextCursor = lastReply ? String(lastReply.sequence) : String(afterCursor);

  return {
    questions: questions.map(toPublicQuestion),
    replies: replies.map(toPublicReply),
    nextCursor,
    serverTime: new Date().toISOString(),
    ...(hasMore ? { hasMore: true } : {}),
  };
}
