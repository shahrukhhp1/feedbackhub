import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleMobileRoute } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { parseBody, parseQuery } from "@/server/api/request";
import {
  addMobileMessage,
  listConversationMessages,
} from "@/server/services/conversations.service";
import {
  addMessageSchema,
  listConversationMessagesQuerySchema,
} from "@/server/validation/mobile";

const conversationIdParamSchema = z.object({
  conversationId: z.uuid(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  return handleMobileRoute(request, "conversations/messages/list", async ({ installation, request }) => {
    const params = conversationIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      throw ApiError.validation("Invalid conversation ID");
    }

    const query = parseQuery(request, listConversationMessagesQuerySchema);
    return listConversationMessages(
      installation,
      params.data.conversationId,
      query.before,
      query.limit,
    );
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  return handleMobileRoute(request, "conversations/messages", async ({ installation, request }) => {
    const params = conversationIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      throw ApiError.validation("Invalid conversation ID");
    }

    const body = await parseBody(request, addMessageSchema);
    return addMobileMessage(installation, params.data.conversationId, body);
  });
}
