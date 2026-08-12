import type { ApiErrorResponse } from "@/shared/contracts/api";
import type {
  Answer,
  App,
  AuditLogEntry,
  Conversation,
  ConversationDetailResponse,
  DashboardOverview,
  HealthStatus,
  Installation,
  Message,
  PaginatedResult,
  Question,
  TeamUser,
} from "@/lib/admin-types";
import type { Role } from "@/shared/constants";

export class AdminApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new AdminApiError(
      body?.error?.code ?? "INTERNAL_ERROR",
      body?.error?.message ?? res.statusText,
      body?.error?.requestId,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const adminApi = {
  getOverview: () => adminFetch<DashboardOverview>("/api/admin/dashboard"),

  getMe: () => adminFetch<{ user: { mustChangePassword: boolean } }>("/api/admin/me"),

  listApps: (params?: { status?: string; cursor?: string; limit?: number }) =>
    adminFetch<PaginatedResult<App>>(`/api/admin/apps${qs(params ?? {})}`),

  getApp: (id: string) => adminFetch<App>(`/api/admin/apps/${id}`),

  createApp: (data: { name: string; slug: string; status?: string }) =>
    adminFetch<{ app: App; clientKey: string }>("/api/admin/apps", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateApp: (id: string, data: { name?: string; status?: string }) =>
    adminFetch<App>(`/api/admin/apps/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  rotateAppKey: (id: string) =>
    adminFetch<{ app: App; clientKey: string }>(`/api/admin/apps/${id}/rotate-key`, {
      method: "POST",
    }),

  listInstallations: (appId: string, params?: { includeRevoked?: boolean }) =>
    adminFetch<{ items: Installation[] }>(
      `/api/admin/apps/${appId}/installations${qs({ appId, includeRevoked: params?.includeRevoked })}`,
    ),

  revokeInstallation: (id: string) =>
    adminFetch<void>(`/api/admin/installations/${id}/revoke`, { method: "POST" }),

  listQuestions: (params?: {
    appId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }) => adminFetch<PaginatedResult<Question>>(`/api/admin/questions${qs(params ?? {})}`),

  getQuestion: (id: string) => adminFetch<Question>(`/api/admin/questions/${id}`),

  createQuestion: (data: Record<string, unknown>) =>
    adminFetch<Question>("/api/admin/questions", { method: "POST", body: JSON.stringify(data) }),

  updateQuestion: (id: string, data: Record<string, unknown>) =>
    adminFetch<Question>(`/api/admin/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  activateQuestion: (id: string) =>
    adminFetch<Question>(`/api/admin/questions/${id}/activate`, { method: "POST" }),

  pauseQuestion: (id: string) =>
    adminFetch<Question>(`/api/admin/questions/${id}/pause`, { method: "POST" }),

  archiveQuestion: (id: string) =>
    adminFetch<Question>(`/api/admin/questions/${id}/archive`, { method: "POST" }),

  duplicateQuestion: (id: string) =>
    adminFetch<Question>(`/api/admin/questions/${id}/duplicate`, { method: "POST" }),

  listInbox: (params?: {
    appId?: string;
    status?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }) => adminFetch<PaginatedResult<Conversation>>(`/api/admin/inbox${qs(params ?? {})}`),

  getConversation: (id: string) =>
    adminFetch<ConversationDetailResponse>(`/api/admin/inbox/${id}`),

  replyToConversation: (id: string, body: string) =>
    adminFetch<Message>(`/api/admin/inbox/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  closeConversation: (id: string) =>
    adminFetch<void>(`/api/admin/inbox/${id}/close`, { method: "POST" }),

  reopenConversation: (id: string) =>
    adminFetch<void>(`/api/admin/inbox/${id}/reopen`, { method: "POST" }),

  listAnswers: (params?: {
    appId?: string;
    questionId?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  }) => adminFetch<PaginatedResult<Answer>>(`/api/admin/answers${qs(params ?? {})}`),

  exportAnswers: async (params: { appId: string; from: string; to: string }) => {
    const res = await fetch(`/api/admin/answers/export${qs(params)}`, {
      credentials: "include",
      headers: { Accept: "text/csv" },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
      throw new AdminApiError(
        body?.error?.code ?? "INTERNAL_ERROR",
        body?.error?.message ?? res.statusText,
        body?.error?.requestId,
      );
    }
    return res.blob();
  },

  listTeam: () => adminFetch<{ items: TeamUser[] }>("/api/admin/team"),

  createTeamUser: (data: { name: string; email: string; role: Role }) =>
    adminFetch<{ user: TeamUser; temporaryPassword: string }>("/api/admin/team", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTeamRole: (id: string, role: Role) =>
    adminFetch<TeamUser>(`/api/admin/team/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  disableTeamUser: (id: string) =>
    adminFetch<TeamUser>(`/api/admin/team/${id}/disable`, { method: "POST" }),

  enableTeamUser: (id: string) =>
    adminFetch<TeamUser>(`/api/admin/team/${id}/enable`, { method: "POST" }),

  resetTeamPassword: (id: string) =>
    adminFetch<{ temporaryPassword: string }>(`/api/admin/team/${id}/reset-password`, {
      method: "POST",
    }),

  revokeTeamSessions: (id: string) =>
    adminFetch<void>(`/api/admin/team/${id}/revoke-sessions`, { method: "POST" }),

  listAuditLogs: (params?: {
    actorUserId?: string;
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  }) => adminFetch<PaginatedResult<AuditLogEntry>>(`/api/admin/audit-logs${qs(params ?? {})}`),

  getHealthReady: () => adminFetch<HealthStatus>("/api/health/ready"),

  getHealthLive: () => adminFetch<HealthStatus>("/api/health/live"),

  completePasswordChange: () =>
    adminFetch<void>("/api/admin/me", { method: "PATCH", body: JSON.stringify({}) }),
};
