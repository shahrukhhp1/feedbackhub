import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody, parseQuery } from "@/server/api/request";
import { assertPermission, canManageApps } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import {
  createAppWithKey,
  listApps,
} from "@/server/services/apps.service";
import { createAppSchema, listAppsQuerySchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    await requireSession();
    const query = parseQuery(request, listAppsQuerySchema);
    return listApps(query);
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageApps(session.user.role));

    const body = await parseBody(request, createAppSchema);
    return createAppWithKey(body, session.user.id, clientIp);
  });
}
