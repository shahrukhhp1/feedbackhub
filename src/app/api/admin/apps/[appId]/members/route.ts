import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import {
  addMemberByEmail,
  listMembersForApp,
} from "@/server/services/app-members.service";
import { addAppMemberSchema } from "@/server/validation/admin";

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
    return listMembersForApp(parsed.data, session.user.id, session.user.role);
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    const { appId } = await context.params;
    const parsed = appIdSchema.safeParse(appId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid app ID");
    }

    const body = await parseBody(request, addAppMemberSchema);
    return addMemberByEmail(
      parsed.data,
      body.email,
      body.appRole,
      session.user.id,
      session.user.role,
      clientIp,
    );
  });
}
