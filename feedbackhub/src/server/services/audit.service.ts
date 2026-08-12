import "server-only";

import { createAuditLog, type NewAuditLog } from "@/server/repositories/audit-logs";

export type LogActionInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
};

export async function logAction(input: LogActionInput) {
  const data: NewAuditLog = {
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? null,
    ipAddress: input.ipAddress ?? null,
  };

  return createAuditLog(data);
}
