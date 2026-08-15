import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody, parseQuery } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import {
  createQuestionForApp,
  listQuestions,
} from "@/server/services/questions.service";
import { createQuestionSchema, listQuestionsQuerySchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    const query = parseQuery(request, listQuestionsQuerySchema);
    return listQuestions(session.user.id, session.user.role, query);
  });
}

export async function POST(request: NextRequest) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();

    const body = await parseBody(request, createQuestionSchema);
    return createQuestionForApp(body, session.user.id, session.user.role, clientIp);
  });
}
