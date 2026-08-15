const MOBILE_API_PREFIX = "/api/v1/";

const CORS_ALLOW_HEADERS = "Content-Type, Authorization, x-request-id";
const CORS_ALLOW_METHODS = "GET, POST, OPTIONS";

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

export function isMobileApiPath(pathname: string): boolean {
  return pathname.startsWith(MOBILE_API_PREFIX);
}

export function resolveCorsOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  return normalizeOrigin(requestOrigin);
}

export function applyMobileApiCorsHeaders(
  response: Response,
  requestOrigin: string | null,
): Response {
  const allowedOrigin = resolveCorsOrigin(requestOrigin);
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  response.headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function createMobileApiPreflightResponse(requestOrigin: string | null): Response {
  const response = new Response(null, { status: 204 });
  return applyMobileApiCorsHeaders(response, requestOrigin);
}
