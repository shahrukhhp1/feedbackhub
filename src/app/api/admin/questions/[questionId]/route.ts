import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import {
  getQuestionById,
  updateQuestionDetails,
} from "@/server/services/questions.service";
import { updateQuestionSchema } from "@/server/validation/admin";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

const questionIdSchema = z.uuid();

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    const { questionId } = await context.params;
    const parsed = questionIdSchema.safeParse(questionId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid question ID");
    }
    return getQuestionById(parsed.data, session.user.id, session.user.role);
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();

    const { questionId } = await context.params;
    const parsed = questionIdSchema.safeParse(questionId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid question ID");
    }

    const body = await parseBody(request, updateQuestionSchema);
    return updateQuestionDetails(
      parsed.data,
      body,
      session.user.id,
      session.user.role,
      clientIp,
    );
  });
}
