import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { assertPermission, canManageApps } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { getApp, updateAppDetails } from "@/server/services/apps.service";
import { updateAppSchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ appId: string }>;
};

const appIdSchema = z.uuid();

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async () => {
    await requireSession();
    const { appId } = await context.params;
    const parsed = appIdSchema.safeParse(appId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid app ID");
    }
    return getApp(parsed.data);
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageApps(session.user.role));

    const { appId } = await context.params;
    const parsed = appIdSchema.safeParse(appId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid app ID");
    }

    const body = await parseBody(request, updateAppSchema);
    return updateAppDetails(parsed.data, body, session.user.id, clientIp);
  });
}
