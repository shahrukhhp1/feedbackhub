import type { NextRequest } from "next/server";
import { handleMobileRoute } from "@/server/api/handler";
import { parseBody, parseQuery } from "@/server/api/request";
import {
  createFeedback,
  listInstallationConversations,
} from "@/server/services/conversations.service";
import {
  createConversationSchema,
  listConversationsQuerySchema,
} from "@/server/validation/mobile";

export async function GET(request: NextRequest) {
  return handleMobileRoute(request, "conversations/list", async ({ installation, request }) => {
    const query = parseQuery(request, listConversationsQuerySchema);
    return listInstallationConversations(installation.id, query.cursor, query.limit);
  });
}

export async function POST(request: NextRequest) {
  return handleMobileRoute(request, "conversations", async ({ installation, request }) => {
    const body = await parseBody(request, createConversationSchema);
    return createFeedback(installation, body);
  });
}
