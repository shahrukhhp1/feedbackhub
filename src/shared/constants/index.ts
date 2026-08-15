export const ROLES = ["superadmin", "admin", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const APP_STATUSES = ["active", "inactive"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const QUESTION_STATUSES = ["draft", "active", "paused", "archived"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const ANSWER_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "rating",
  "yes_no",
] as const;
export type AnswerType = (typeof ANSWER_TYPES)[number];

export const CONVERSATION_STATUSES = ["open", "waiting_for_user", "closed"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const SENDER_TYPES = ["mobile_user", "admin", "system"] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

export const SOURCE_TYPES = ["general_feedback", "question_answer"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const PLATFORMS = ["ios", "android", "web", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const APP_MEMBER_ROLES = ["admin", "viewer"] as const;
export type AppMemberRole = (typeof APP_MEMBER_ROLES)[number];

export const MAX_MESSAGE_BODY_LENGTH = 10_000;
export const MAX_SUBJECT_LENGTH = 200;
export const SYNC_REPLY_LIMIT = 100;
export const DEFAULT_PAGE_LIMIT = 20;
