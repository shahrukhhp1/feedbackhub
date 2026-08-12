import type { NextRequest } from "next/server";
import { z } from "zod";
import { handleMobileRoute } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { parseBody } from "@/server/api/request";
import { dismissQuestionForInstallation } from "@/server/services/questions.service";
import { dismissQuestionSchema } from "@/server/validation/mobile";

const questionIdParamSchema = z.object({
  questionId: z.uuid(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> },
) {
  return handleMobileRoute(request, "questions/dismiss", async ({ installation, request }) => {
    const params = questionIdParamSchema.safeParse(await context.params);
    if (!params.success) {
      throw ApiError.validation("Invalid question ID");
    }

    await parseBody(request, dismissQuestionSchema);
    await dismissQuestionForInstallation(
      params.data.questionId,
      installation.id,
      installation.appId,
    );

    return { dismissed: true };
  });
}
