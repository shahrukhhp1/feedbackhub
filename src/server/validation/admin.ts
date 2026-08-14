import { z } from "zod";
import {
  ANSWER_TYPES,
  APP_STATUSES,
  CONVERSATION_STATUSES,
  DEFAULT_PAGE_LIMIT,
  MAX_MESSAGE_BODY_LENGTH,
  MAX_SUBJECT_LENGTH,
  QUESTION_STATUSES,
  ROLES,
  SYNC_REPLY_LIMIT,
} from "@/shared/constants";

const uuidSchema = z.uuid();
const nonEmptyString = z.string().trim().min(1);

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_LIMIT),
});

export const dateRangeQuerySchema = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export const questionOptionsSchema = z.object({
  choices: z.array(nonEmptyString.max(200)).min(2).max(50),
});

export const createAppSchema = z.object({
  name: nonEmptyString.max(120),
  slug: nonEmptyString.max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  status: z.enum(APP_STATUSES).default("active"),
});

export const updateAppSchema = z
  .object({
    name: nonEmptyString.max(120).optional(),
    status: z.enum(APP_STATUSES).optional(),
  })
  .refine((data) => data.name !== undefined || data.status !== undefined, {
    message: "At least one field must be provided",
  });

export const listAppsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(APP_STATUSES).optional(),
});

export const listInstallationsQuerySchema = paginationQuerySchema.extend({
  appId: uuidSchema,
  includeRevoked: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export const createQuestionSchema = z.object({
  appId: uuidSchema,
  title: nonEmptyString.max(200),
  description: z.string().trim().max(MAX_MESSAGE_BODY_LENGTH).optional(),
  answerType: z.enum(ANSWER_TYPES),
  options: questionOptionsSchema.optional(),
  required: z.boolean().default(false),
  allowMultipleAnswers: z.boolean().default(false),
  status: z.enum(QUESTION_STATUSES).default("draft"),
  startsAt: z.iso.datetime({ offset: true }).optional(),
  endsAt: z.iso.datetime({ offset: true }).optional(),
});

export const updateQuestionSchema = z
  .object({
    title: nonEmptyString.max(200).optional(),
    description: z.string().trim().max(MAX_MESSAGE_BODY_LENGTH).nullable().optional(),
    required: z.boolean().optional(),
    allowMultipleAnswers: z.boolean().optional(),
    status: z.enum(QUESTION_STATUSES).optional(),
    startsAt: z.iso.datetime({ offset: true }).nullable().optional(),
    endsAt: z.iso.datetime({ offset: true }).nullable().optional(),
    options: questionOptionsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listQuestionsQuerySchema = paginationQuerySchema.extend({
  appId: uuidSchema.optional(),
  status: z.enum(QUESTION_STATUSES).optional(),
});

export const inboxListQuerySchema = paginationQuerySchema.extend({
  appId: uuidSchema.optional(),
  status: z.enum(CONVERSATION_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const adminReplySchema = z.object({
  body: nonEmptyString.max(MAX_MESSAGE_BODY_LENGTH),
});

export const listAnswersQuerySchema = paginationQuerySchema.extend({
  appId: uuidSchema.optional(),
  questionId: uuidSchema.optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export const exportAnswersQuerySchema = z.object({
  appId: uuidSchema,
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
});

export const createTeamUserSchema = z.object({
  name: nonEmptyString.max(120),
  email: z.email().max(320),
  role: z.enum(ROLES),
});

export const updateTeamUserRoleSchema = z.object({
  role: z.enum(ROLES),
});

export const auditLogQuerySchema = paginationQuerySchema.extend({
  actorUserId: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).max(100).optional(),
  entityType: z.string().trim().min(1).max(50).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export const conversationMessagesQuerySchema = z.object({
  before: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().min(0).optional()),
  limit: z.coerce.number().int().min(1).max(SYNC_REPLY_LIMIT).default(50),
});

export const uuidParamSchema = z.object({
  id: uuidSchema,
});

export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type InboxListQuery = z.infer<typeof inboxListQuerySchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
export type CreateTeamUserInput = z.infer<typeof createTeamUserSchema>;
