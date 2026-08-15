import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseQuery } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import { listAppInstallations } from "@/server/services/apps.service";
import { listInstallationsQuerySchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ appId: string }>;
};

const appIdSchema = z.uuid();

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    const { appId } = await context.params;
    const parsed = appIdSchema.safeParse(appId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid app ID");
    }

    const query = parseQuery(request, listInstallationsQuerySchema);
    if (query.appId !== parsed.data) {
      throw ApiError.validation("appId query parameter must match route appId");
    }

    return {
      items: await listAppInstallations(parsed.data, session.user.id, session.user.role, {
        includeRevoked: query.includeRevoked,
      }),
    };
  });
}
