import "server-only";

import type { NextRequest } from "next/server";
import { ApiError } from "@/server/api/errors";
import { applyMobileApiCorsHeaders } from "@/server/api/cors";
import { getClientIp, getRequestId } from "@/server/api/request";
import { jsonError, jsonOk } from "@/server/api/response";
import { authenticateInstallation } from "@/server/auth/installation";
import { ApiError as SessionApiError } from "@/server/errors";
import { createRequestLogger } from "@/server/logging/logger";
import {
  checkInstallationRateLimit,
  checkIpRateLimit,
} from "@/server/security/rate-limit";
import type { ApiErrorCode } from "@/shared/contracts/api";
import type { AuthenticatedInstallationContext } from "@/server/auth/installation";

type RouteContext = {
  request: NextRequest;
  requestId: string;
  ip: string;
};

type MobileRouteContext = RouteContext & AuthenticatedInstallationContext;

type AdminRouteContext = {
  requestId: string;
  clientIp: string;
};

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof SessionApiError) {
    return new ApiError(error.code as ApiErrorCode, error.message, { status: error.status });
  }
  return ApiError.internal();
}

function logRequest(
  request: NextRequest,
  requestId: string,
  status: number,
  code: string | undefined,
  start: number,
): void {
  createRequestLogger(requestId).info({
    method: request.method,
    path: request.nextUrl.pathname,
    status,
    code,
    durationMs: Date.now() - start,
  });
}

function withMobileCors(request: NextRequest, response: Response): Response {
  return applyMobileApiCorsHeaders(response, request.headers.get("origin"));
}

export async function handlePublicRoute<T>(
  request: NextRequest,
  endpoint: string,
  handler: (ctx: RouteContext) => Promise<T>,
): Promise<Response> {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const start = Date.now();

  const rateLimit = checkIpRateLimit(ip, endpoint);
  if (!rateLimit.allowed) {
    logRequest(request, requestId, 429, "RATE_LIMITED", start);
    return withMobileCors(request, jsonError(ApiError.rateLimited(), requestId));
  }

  try {
    const data = await handler({ request, requestId, ip });
    logRequest(request, requestId, 200, undefined, start);
    return withMobileCors(request, jsonOk(data, requestId));
  } catch (error) {
    const apiError = toApiError(error);
    logRequest(request, requestId, apiError.status, apiError.code, start);
    return withMobileCors(request, jsonError(apiError, requestId));
  }
}

export async function handleAdminRequest<T>(
  request: NextRequest,
  handler: (ctx: AdminRouteContext) => Promise<T>,
): Promise<Response> {
  const requestId = getRequestId(request);
  const clientIp = getClientIp(request);
  const start = Date.now();

  try {
    const data = await handler({ requestId, clientIp });
    logRequest(request, requestId, 200, undefined, start);
    return jsonOk(data, requestId);
  } catch (error) {
    const apiError = toApiError(error);
    logRequest(request, requestId, apiError.status, apiError.code, start);
    return jsonError(apiError, requestId);
  }
}

export async function handleMobileRoute<T>(
  request: NextRequest,
  endpoint: string,
  handler: (ctx: MobileRouteContext) => Promise<T>,
): Promise<Response> {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const start = Date.now();

  const ipRateLimit = checkIpRateLimit(ip, endpoint);
  if (!ipRateLimit.allowed) {
    logRequest(request, requestId, 429, "RATE_LIMITED", start);
    return withMobileCors(request, jsonError(ApiError.rateLimited(), requestId));
  }

  try {
    const auth = await authenticateInstallation(request);

    const installationRateLimit = checkInstallationRateLimit(auth.installation.id, endpoint);
    if (!installationRateLimit.allowed) {
      logRequest(request, requestId, 429, "RATE_LIMITED", start);
      return withMobileCors(request, jsonError(ApiError.rateLimited(), requestId));
    }

    const data = await handler({ request, requestId, ip, ...auth });
    logRequest(request, requestId, 200, undefined, start);
    return withMobileCors(request, jsonOk(data, requestId));
  } catch (error) {
    const apiError = toApiError(error);
    logRequest(request, requestId, apiError.status, apiError.code, start);
    return withMobileCors(request, jsonError(apiError, requestId));
  }
}
