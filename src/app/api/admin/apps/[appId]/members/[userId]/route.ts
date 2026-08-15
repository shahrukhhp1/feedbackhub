import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import {
  removeMember,
  updateMemberRole,
} from "@/server/services/app-members.service";
import { updateAppMemberSchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ appId: string; userId: string }>;
};

const appIdSchema = z.uuid();
const userIdSchema = z.string().trim().min(1);

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    const { appId, userId } = await context.params;
    const parsedAppId = appIdSchema.safeParse(appId);
    const parsedUserId = userIdSchema.safeParse(userId);
    if (!parsedAppId.success || !parsedUserId.success) {
      throw ApiError.validation("Invalid app or user ID");
    }

    const body = await parseBody(request, updateAppMemberSchema);
    return updateMemberRole(
      parsedAppId.data,
      parsedUserId.data,
      body.appRole,
      session.user.id,
      session.user.role,
      clientIp,
    );
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    const { appId, userId } = await context.params;
    const parsedAppId = appIdSchema.safeParse(appId);
    const parsedUserId = userIdSchema.safeParse(userId);
    if (!parsedAppId.success || !parsedUserId.success) {
      throw ApiError.validation("Invalid app or user ID");
    }

    await removeMember(
      parsedAppId.data,
      parsedUserId.data,
      session.user.id,
      session.user.role,
      clientIp,
    );
  });
}
