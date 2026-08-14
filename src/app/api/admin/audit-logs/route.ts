import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { parseQuery } from "@/server/api/request";
import { assertPermission, canViewAuditLog } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { listAuditLogs } from "@/server/repositories/audit-logs";
import { auditLogQuerySchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    assertPermission(canViewAuditLog(session.user.role));

    const query = parseQuery(request, auditLogQuerySchema);
    const page = await listAuditLogs({
      cursor: query.cursor,
      limit: query.limit,
      actorUserId: query.actorUserId,
      action: query.action,
      entityType: query.entityType,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    return {
      items: page.items,
      nextCursor: page.nextCursor,
      hasMore: page.nextCursor !== null,
    };
  });
}
