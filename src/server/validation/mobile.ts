import { z } from "zod";
import {
  ANSWER_TYPES,
  MAX_MESSAGE_BODY_LENGTH,
  MAX_SUBJECT_LENGTH,
  PLATFORMS,
  SYNC_REPLY_LIMIT,
} from "@/shared/constants";

const clientRequestIdSchema = z.uuid();
const uuidSchema = z.uuid();

export const registerInstallationSchema = z.object({
  appId: uuidSchema,
  clientKey: z.string().trim().min(1).max(200),
  userGuid: z.string().trim().min(1).max(128),
  contactEmail: z.string().trim().email().max(255).optional(),
  platform: z.enum(PLATFORMS).optional(),
  appVersion: z.string().trim().min(1).max(40).optional(),
  locale: z.string().trim().min(1).max(20).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
});

const answerPayloadSchema = z.object({
  answer: z.unknown(),
  clientRequestId: clientRequestIdSchema,
});

export const submitAnswerRemoteSchema = answerPayloadSchema.extend({
  questionId: uuidSchema,
});

export const submitAnswerHardcodedSchema = answerPayloadSchema.extend({
  externalQuestionKey: z.string().trim().min(1).max(120),
  questionText: z.string().trim().min(1).max(MAX_MESSAGE_BODY_LENGTH),
  answerType: z.enum(ANSWER_TYPES),
});

const submitAnswerDiscriminatedSchema = z.discriminatedUnion("source", [
  submitAnswerRemoteSchema.extend({ source: z.literal("remote") }),
  submitAnswerHardcodedSchema.extend({ source: z.literal("hardcoded") }),
]);

export const submitAnswerSchema = z.preprocess((input) => {
  if (!input || typeof input !== "object") {
    return input;
  }

  if ("questionId" in input) {
    return { ...input, source: "remote" };
  }

  if ("externalQuestionKey" in input) {
    return { ...input, source: "hardcoded" };
  }

  return input;
}, submitAnswerDiscriminatedSchema);

export const dismissQuestionSchema = z.object({
  clientRequestId: clientRequestIdSchema,
});

export const createConversationSchema = z.object({
  subject: z.string().trim().min(1).max(MAX_SUBJECT_LENGTH),
  message: z.string().trim().min(1).max(MAX_MESSAGE_BODY_LENGTH),
  clientRequestId: clientRequestIdSchema,
});

export const addMessageSchema = z.object({
  body: z.string().trim().min(1).max(MAX_MESSAGE_BODY_LENGTH),
  clientRequestId: clientRequestIdSchema,
});

export const acknowledgeMessagesSchema = z.object({
  delivered: z.array(uuidSchema).default([]),
  read: z.array(uuidSchema).default([]),
});

export const syncQuerySchema = z.object({
  after: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? 0 : Number(value)))
    .pipe(z.number().int().min(0)),
});

export const listConversationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listConversationMessagesQuerySchema = z.object({
  before: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().min(0).optional()),
  limit: z.coerce.number().int().min(1).max(SYNC_REPLY_LIMIT).default(50),
});

export type RegisterInstallationInput = z.infer<typeof registerInstallationSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type DismissQuestionInput = z.infer<typeof dismissQuestionSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type AcknowledgeMessagesInput = z.infer<typeof acknowledgeMessagesSchema>;
export type SyncQueryInput = z.infer<typeof syncQuerySchema>;
