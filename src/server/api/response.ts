import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/shared/contracts/api";
import { ApiError } from "@/server/api/errors";

const REQUEST_ID_HEADER = "x-request-id";

export function jsonOk<T>(data: T, requestId: string, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, {
    ...init,
    headers: withRequestIdHeader(init?.headers, requestId),
  });
}

export function jsonError(
  error: ApiError,
  requestId: string,
  init?: ResponseInit,
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      requestId,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };

  return NextResponse.json(body, {
    ...init,
    status: error.status,
    headers: withRequestIdHeader(init?.headers, requestId),
  });
}

function withRequestIdHeader(headers: HeadersInit | undefined, requestId: string): Headers {
  const merged = new Headers(headers);
  merged.set(REQUEST_ID_HEADER, requestId);
  return merged;
}
