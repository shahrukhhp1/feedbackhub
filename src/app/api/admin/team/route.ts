import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { assertPermission, canManageTeam } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { createTeamUser, listTeamUsers } from "@/server/services/team.service";
import { createTeamUserSchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    assertPermission(canManageTeam(session.user.role));
    const items = await listTeamUsers();
    return { items };
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageTeam(session.user.role));

    const body = await parseBody(request, createTeamUserSchema);
    return createTeamUser(body, session.user.id, clientIp);
  });
}
