import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { assertPermission, canManageTeam } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { updateTeamUserRole } from "@/server/services/team.service";
import { updateTeamUserRoleSchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

const userIdSchema = z.string().trim().min(1);

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageTeam(session.user.role));

    const { userId } = await context.params;
    const parsed = userIdSchema.safeParse(userId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid user ID");
    }

    const body = await parseBody(request, updateTeamUserRoleSchema);
    return updateTeamUserRole(parsed.data, body, session.user.id, clientIp);
  });
}
