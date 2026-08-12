export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "PAYLOAD_TOO_LARGE",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SyncQuestion {
  id: string;
  title: string;
  description: string | null;
  answerType: string;
  options: unknown;
  required: boolean;
}

export interface SyncReply {
  id: string;
  sequence: number;
  conversationId: string;
  senderType: string;
  body: string;
  createdAt: string;
}

export interface SyncResponse {
  questions: SyncQuestion[];
  replies: SyncReply[];
  nextCursor: string;
  serverTime: string;
  hasMore?: boolean;
}
