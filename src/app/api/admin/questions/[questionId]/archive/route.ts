import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { handleAdminRequest } from "@/server/api/handler";
import { assertPermission, canManageQuestions } from "@/server/auth/permissions";
import { requireSession } from "@/server/auth/session";
import { setQuestionStatus } from "@/server/services/questions.service";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

const questionIdSchema = z.uuid();

export async function POST(request: NextRequest, context: RouteContext) {
  return handleAdminRequest(request, async ({ clientIp }) => {
    const session = await requireSession();
    assertPermission(canManageQuestions(session.user.role));

    const { questionId } = await context.params;
    const parsed = questionIdSchema.safeParse(questionId);
    if (!parsed.success) {
      throw ApiError.validation("Invalid question ID");
    }

    return setQuestionStatus(
      parsed.data,
      "archived",
      "question.archived",
      session.user.id,
      clientIp,
    );
  });
}
