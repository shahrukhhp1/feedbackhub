import type { NextRequest } from "next/server";
import { handleMobileRoute } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { submitAnswer } from "@/server/services/answers.service";
import { submitAnswerSchema } from "@/server/validation/mobile";

export async function POST(request: NextRequest) {
  return handleMobileRoute(request, "answers", async ({ installation, request }) => {
    const body = await parseBody(request, submitAnswerSchema);
    return submitAnswer(installation, body);
  });
}
