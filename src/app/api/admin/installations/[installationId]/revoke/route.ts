import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { requireSession } from "@/server/auth/session";
import { revokeAppInstallation } from "@/server/services/apps.service";

type RouteContext = {
  params: Promise<{ installationId: string }>;
};

const installationIdSchema = z.uuid();

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();

    const { installationId } = await context.params;
    const parsed = installationIdSchema.safeParse(installationId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid installation ID");
    }

    return revokeAppInstallation(parsed.data, session.user.id, session.user.role, clientIp);
  });
}
