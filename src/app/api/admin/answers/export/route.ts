import type { NextRequest } from "next/server";
import { ApiError } from "@/server/api/errors";
import { getRequestId, parseQuery } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import { ApiError as SessionApiError } from "@/server/errors";
import { exportAnswersCsv } from "@/server/services/answers.service";
import { exportAnswersQuerySchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const session = await requireSession();
    const query = parseQuery(request, exportAnswersQuerySchema);
    const { filename, content } = await exportAnswersCsv(
      query.appId,
      query.from,
      query.to,
      session.user.id,
      session.user.role,
    );

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : error instanceof SessionApiError
          ? new ApiError(error.code as never, error.message, { status: error.status })
          : ApiError.internal();

    const body = {
      error: {
        code: apiError.code,
        message: apiError.message,
        requestId,
      },
    };

    return Response.json(body, {
      status: apiError.status,
      headers: { "x-request-id": requestId },
    });
  }
}
