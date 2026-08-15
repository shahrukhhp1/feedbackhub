import "server-only";

import { ApiError } from "@/server/api/errors";
import { assertCanManageApp, assertCanViewApp } from "@/server/auth/app-access";
import { getAppById } from "@/server/repositories/apps";
import {
  countAnswersForQuestion,
  createQuestion,
  duplicateQuestion,
  getQuestion,
  listQuestionsPaginated,
  updateQuestionMetadata,
} from "@/server/repositories/questions";
import type { QuestionStatus, Role } from "@/shared/constants";
import type { CreateQuestionInput, UpdateQuestionInput } from "@/server/validation/admin";
import { resolveAccessibleAppIdsForActor } from "./apps.service";
import { logAction } from "./audit.service";

const MEANING_FIELDS = ["options", "required", "allowMultipleAnswers"] as const;

export async function createQuestionForApp(
  input: CreateQuestionInput,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  await assertCanManageApp(actorUserId, actorRole, input.appId);
  const app = await getAppById(input.appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  validateQuestionOptions(input.answerType, input.options);

  const question = await createQuestion({
    appId: input.appId,
    title: input.title,
    description: input.description,
    answerType: input.answerType,
    options: input.options ?? null,
    required: input.required,
    allowMultipleAnswers: input.allowMultipleAnswers,
    status: input.status,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    createdBy: actorUserId,
  });

  await logAction({
    actorUserId,
    action: "question.created",
    entityType: "question",
    entityId: question.id,
    metadata: { appId: question.appId },
    ipAddress,
  });

  return question;
}

export async function listQuestions(
  actorUserId: string,
  actorRole: Role | string,
  filters: {
    appId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  },
) {
  const appIds = await resolveAccessibleAppIdsForActor(actorUserId, actorRole, filters.appId);
  const page = await listQuestionsPaginated({
    ...filters,
    appId: undefined,
    appIds: appIds,
  });
  return {
    items: page.items,
    nextCursor: page.nextCursor,
    hasMore: page.nextCursor !== null,
  };
}

export async function getQuestionById(
  questionId: string,
  actorUserId: string,
  actorRole: Role | string,
) {
  const question = await getQuestion(questionId);
  if (!question) {
    throw ApiError.notFound("Question not found");
  }
  await assertCanViewApp(actorUserId, actorRole, question.appId);
  return question;
}

export async function updateQuestionDetails(
  questionId: string,
  input: UpdateQuestionInput,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const existing = await getQuestion(questionId);
  if (!existing) {
    throw ApiError.notFound("Question not found");
  }
  await assertCanManageApp(actorUserId, actorRole, existing.appId);

  const answerCount = await countAnswersForQuestion(questionId);
  if (answerCount > 0) {
    for (const field of MEANING_FIELDS) {
      if (input[field] !== undefined) {
        throw ApiError.conflict(
          "Cannot change question meaning after answers have been submitted",
        );
      }
    }
  }

  if (input.options !== undefined) {
    validateQuestionOptions(existing.answerType, input.options);
  }

  const question = await updateQuestionMetadata(questionId, {
    title: input.title,
    description: input.description,
    required: input.required,
    allowMultipleAnswers: input.allowMultipleAnswers,
    status: input.status,
    startsAt:
      input.startsAt === null ? null : input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt === null ? null : input.endsAt ? new Date(input.endsAt) : undefined,
    options: input.options,
  });

  if (!question) {
    throw ApiError.notFound("Question not found");
  }

  await logAction({
    actorUserId,
    action: "question.updated",
    entityType: "question",
    entityId: question.id,
    metadata: input,
    ipAddress,
  });

  return question;
}

export async function setQuestionStatus(
  questionId: string,
  status: QuestionStatus,
  action: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const existing = await getQuestion(questionId);
  if (!existing) {
    throw ApiError.notFound("Question not found");
  }
  await assertCanManageApp(actorUserId, actorRole, existing.appId);

  const question = await updateQuestionMetadata(questionId, { status });
  if (!question) {
    throw ApiError.notFound("Question not found");
  }

  await logAction({
    actorUserId,
    action,
    entityType: "question",
    entityId: question.id,
    metadata: { status },
    ipAddress,
  });

  return question;
}

export async function duplicateQuestionById(
  questionId: string,
  actorUserId: string,
  actorRole: Role | string,
  ipAddress?: string,
) {
  const source = await getQuestion(questionId);
  if (!source) {
    throw ApiError.notFound("Question not found");
  }
  await assertCanManageApp(actorUserId, actorRole, source.appId);

  const question = await duplicateQuestion(questionId, actorUserId);

  await logAction({
    actorUserId,
    action: "question.duplicated",
    entityType: "question",
    entityId: question.id,
    metadata: { sourceQuestionId: questionId },
    ipAddress,
  });

  return question;
}

function validateQuestionOptions(
  answerType: string,
  options?: { choices: string[] } | null,
) {
  const choiceTypes = ["single_choice", "multiple_choice"];
  if (choiceTypes.includes(answerType) && !options?.choices?.length) {
    throw ApiError.validation("Choice questions require at least two options");
  }
}
