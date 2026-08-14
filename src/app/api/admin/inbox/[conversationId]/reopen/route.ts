import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { assertPermission, canManageInbox } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { reopenConversation } from "@/server/services/inbox.service";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

const conversationIdSchema = z.uuid();

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageInbox(session.user.role));

    const { conversationId } = await context.params;
    const parsed = conversationIdSchema.safeParse(conversationId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid conversation ID");
    }

    return reopenConversation(parsed.data, session.user.id, clientIp);
  });
}
