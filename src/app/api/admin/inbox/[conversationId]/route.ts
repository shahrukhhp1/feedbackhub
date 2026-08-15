import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseQuery } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import { getInboxConversationDetail } from "@/server/services/inbox.service";
import { conversationMessagesQuerySchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

const conversationIdSchema = z.uuid();

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    const { conversationId } = await context.params;
    const parsed = conversationIdSchema.safeParse(conversationId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid conversation ID");
    }

    parseQuery(request, conversationMessagesQuerySchema);
    return getInboxConversationDetail(
      parsed.data,
      session.user.id,
      session.user.role,
    );
  });
}
