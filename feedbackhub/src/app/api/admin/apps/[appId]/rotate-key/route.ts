import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { assertPermission, canManageApps } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { rotateAppClientKey } from "@/server/services/apps.service";

type RouteContext = {
  params: Promise<{ appId: string }>;
};

const appIdSchema = z.uuid();

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageApps(session.user.role));

    const { appId } = await context.params;
    const parsed = appIdSchema.safeParse(appId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid app ID");
    }

    return rotateAppClientKey(parsed.data, session.user.id, clientIp);
  });
}
