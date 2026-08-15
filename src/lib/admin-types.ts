import type {
  AnswerType,
  AppMemberRole,
  AppStatus,
  ConversationStatus,
  QuestionStatus,
  Role,
} from "@/shared/constants";
import type { PaginatedResult } from "@/shared/contracts/api";

export type { PaginatedResult };

export interface DashboardOverview {
  openConversations: number;
  waitingForUserConversations: number;
  answersLast7Days: number;
  answersLast30Days: number;
  recentActivity: Array<{
    id: number;
    action: string;
    entityType: string;
    entityId: string | null;
    actorUserId: string | null;
    createdAt: string;
  }>;
}

export interface AppAccess {
  appRole: AppMemberRole | null;
  canManageApp: boolean;
  canManageMembers: boolean;
}

export interface App {
  id: string;
  name: string;
  slug: string;
  clientKey: string;
  status: AppStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  access?: AppAccess;
}

export interface AppMember {
  userId: string;
  email: string;
  name: string;
  appRole: AppMemberRole;
  createdAt: string;
}

export interface AppMembersResponse {
  items: AppMember[];
  canManageMembers: boolean;
}

export interface Installation {
  id: string;
  appId: string;
  userGuid: string;
  contactEmail: string | null;
  platform: string | null;
  appVersion: string | null;
  locale: string | null;
  timezone: string | null;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  appId: string;
  title: string;
  description: string | null;
  answerType: AnswerType;
  options: { choices: string[] } | null;
  required: boolean;
  allowMultipleAnswers: boolean;
  status: QuestionStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  appId: string;
  installationId: string;
  answerId: string | null;
  sourceType: string;
  subject: string;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: "mobile_user" | "admin" | "system";
  adminUserId: string | null;
  body: string;
  createdAt: string;
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  installation: Installation;
  answer: {
    id: string;
    questionTextSnapshot: string;
    answerType: AnswerType;
    answer: unknown;
  } | null;
  messages: Message[];
  messagesNextCursor: string | null;
}

export interface Answer {
  id: string;
  appId: string;
  installationId: string;
  userGuid: string;
  contactEmail: string | null;
  questionId: string | null;
  externalQuestionKey: string | null;
  questionTextSnapshot: string;
  answerType: AnswerType;
  answer: unknown;
  createdAt: string;
}

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  disabledAt: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface HealthStatus {
  status: string;
  checks?: { database: boolean };
}
