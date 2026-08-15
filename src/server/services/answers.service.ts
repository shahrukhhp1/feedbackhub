import "server-only";

import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { assertCanManageApp, assertCanViewApp } from "@/server/auth/app-access";
import { getAppById } from "@/server/repositories/apps";
import {
  createAnswer,
  getAnswerByClientRequestId,
  getAnswerById,
  listAnswers,
  listAnswersForExport,
} from "@/server/repositories/answers";
import { createConversation, getConversation } from "@/server/repositories/conversations";
import type { Installation } from "@/server/repositories/installations";
import { createMessage } from "@/server/repositories/messages";
import { getQuestion } from "@/server/repositories/questions";
import { escapeCsvField } from "@/server/security/csv";
import { validateAnswerContent } from "@/server/validation/answers";
import type { SubmitAnswerInput } from "@/server/validation/mobile";
import type { Role } from "@/shared/constants";
import { findConversationByAnswerId } from "./conversations.service";
import { resolveAccessibleAppIdsForActor } from "./apps.service";
import { isQuestionEligible } from "./questions/eligibility";

export type SubmitAnswerResult = {
  answerId: string;
  conversationId: string;
};

export async function submitAnswer(
  installation: Installation,
  input: SubmitAnswerInput,
): Promise<SubmitAnswerResult> {
  const existing = await getAnswerByClientRequestId(installation.id, input.clientRequestId);
  if (existing) {
    const conversation = await findConversationByAnswerId(existing.id);
    return {
      answerId: existing.id,
      conversationId: conversation?.id ?? "",
    };
  }

  if (input.source === "remote") {
    return submitRemoteAnswer(installation, input);
  }

  return submitHardcodedAnswer(installation, input);
}

async function submitRemoteAnswer(
  installation: Installation,
  input: Extract<SubmitAnswerInput, { source: "remote" }>,
): Promise<SubmitAnswerResult> {
  const question = await getQuestion(input.questionId);
  if (!question || question.appId !== installation.appId) {
    throw ApiError.notFound("Question not found");
  }

  if (!isQuestionEligible(question, new Date())) {
    throw ApiError.forbidden("Question is not currently available");
  }

  const validation = validateAnswerContent(
    question.answerType as Parameters<typeof validateAnswerContent>[0],
    input.answer,
    question.options as Parameters<typeof validateAnswerContent>[2],
  );
  if (!validation.ok) {
    throw ApiError.validation(validation.error);
  }

  return createAnswerWithConversation(installation, {
    questionId: question.id,
    questionTextSnapshot: question.title,
    answerType: question.answerType,
    answer: validation.value,
    clientRequestId: input.clientRequestId,
  });
}

async function submitHardcodedAnswer(
  installation: Installation,
  input: Extract<SubmitAnswerInput, { source: "hardcoded" }>,
): Promise<SubmitAnswerResult> {
  const validation = validateAnswerContent(input.answerType, input.answer);
  if (!validation.ok) {
    throw ApiError.validation(validation.error);
  }

  return createAnswerWithConversation(installation, {
    externalQuestionKey: input.externalQuestionKey,
    questionTextSnapshot: input.questionText,
    answerType: input.answerType,
    answer: validation.value,
    clientRequestId: input.clientRequestId,
  });
}

async function createAnswerWithConversation(
  installation: Installation,
  data: {
    questionId?: string;
    externalQuestionKey?: string;
    questionTextSnapshot: string;
    answerType: string;
    answer: unknown;
    clientRequestId: string;
  },
): Promise<SubmitAnswerResult> {
  return getDb().transaction(async (tx) => {
    const answer = await createAnswer(
      {
        appId: installation.appId,
        installationId: installation.id,
        questionId: data.questionId ?? null,
        externalQuestionKey: data.externalQuestionKey ?? null,
        questionTextSnapshot: data.questionTextSnapshot,
        answerType: data.answerType,
        answer: data.answer,
        clientRequestId: data.clientRequestId,
      },
      tx,
    );

    const conversation = await createConversation(
      {
        appId: installation.appId,
        installationId: installation.id,
        answerId: answer.id,
        sourceType: "question_answer",
        subject: data.questionTextSnapshot.slice(0, 200),
        status: "open",
        lastMessageAt: new Date(),
      },
      tx,
    );

    await createMessage(
      {
        conversationId: conversation.id,
        senderType: "system",
        body: "Answer submitted",
      },
      tx,
    );

    return {
      answerId: answer.id,
      conversationId: conversation.id,
    };
  });
}

export async function getAnswerDetail(answerId: string) {
  const answer = await getAnswerById(answerId);
  if (!answer) {
    throw ApiError.notFound("Answer not found");
  }
  return answer;
}

export async function getAnswerConversation(answerId: string) {
  const conversation = await findConversationByAnswerId(answerId);
  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }
  return getConversation(conversation.id);
}

export async function listAnswersForAdmin(
  actorUserId: string,
  actorRole: Role | string,
  filters: {
    appId?: string;
    questionId?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  },
) {
  const appIds = await resolveAccessibleAppIdsForActor(actorUserId, actorRole, filters.appId);
  const page = await listAnswers({
    appIds,
    questionId: filters.questionId,
    from: filters.from ? new Date(filters.from) : undefined,
    to: filters.to ? new Date(filters.to) : undefined,
    cursor: filters.cursor,
    limit: filters.limit,
  });

  return {
    items: page.items.map((row) => ({
      id: row.id,
      appId: row.appId,
      installationId: row.installationId,
      userGuid: row.userGuid,
      contactEmail: row.contactEmail,
      questionId: row.questionId,
      externalQuestionKey: row.externalQuestionKey,
      questionTextSnapshot: row.questionTextSnapshot,
      answerType: row.answerType,
      answer: row.answer,
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor: page.nextCursor,
    hasMore: page.nextCursor !== null,
  };
}

export async function exportAnswersCsv(
  appId: string,
  from: string,
  to: string,
  actorUserId: string,
  actorRole: Role | string,
) {
  await assertCanViewApp(actorUserId, actorRole, appId);
  const app = await getAppById(appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const rows = await listAnswersForExport(appId, fromDate, toDate);

  const headers = [
    "id",
    "appId",
    "userGuid",
    "contactEmail",
    "installationId",
    "questionId",
    "externalQuestionKey",
    "questionTextSnapshot",
    "answerType",
    "answer",
    "clientRequestId",
    "createdAt",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.appId,
        row.userGuid,
        row.contactEmail ?? "",
        row.installationId,
        row.questionId ?? "",
        row.externalQuestionKey ?? "",
        row.questionTextSnapshot,
        row.answerType,
        JSON.stringify(row.answer),
        row.clientRequestId,
        row.createdAt.toISOString(),
      ]
        .map((value) => escapeCsvField(String(value)))
        .join(","),
    ),
  ];

  return {
    filename: `answers-${app.slug}-${fromDate.toISOString().slice(0, 10)}-${toDate.toISOString().slice(0, 10)}.csv`,
    content: lines.join("\n"),
  };
}
