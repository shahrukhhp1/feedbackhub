import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import { replyToConversation } from "@/server/services/inbox.service";
import { adminReplySchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

const conversationIdSchema = z.uuid();

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();

    const { conversationId } = await context.params;
    const parsed = conversationIdSchema.safeParse(conversationId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid conversation ID");
    }

    const body = await parseBody(request, adminReplySchema);
    return replyToConversation(
      parsed.data,
      body,
      session.user.id,
      session.user.role,
      clientIp,
    );
  });
}
