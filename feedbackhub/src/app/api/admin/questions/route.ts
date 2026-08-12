import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody, parseQuery } from "@/server/api/request";
import { assertPermission, canManageQuestions } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import {
  createQuestionForApp,
  listQuestions,
} from "@/server/services/questions.service";
import { createQuestionSchema, listQuestionsQuerySchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    await requireSession();
    const query = parseQuery(request, listQuestionsQuerySchema);
    return listQuestions(query);
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageQuestions(session.user.role));

    const body = await parseBody(request, createQuestionSchema);
    return createQuestionForApp(body, session.user.id, clientIp);
  });
}
