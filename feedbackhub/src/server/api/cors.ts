const MOBILE_API_PREFIX = "/api/v1/";

const CORS_ALLOW_HEADERS = "Content-Type, Authorization, x-request-id";
const CORS_ALLOW_METHODS = "GET, POST, OPTIONS";

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isMobileApiPath(pathname: string): boolean {
  return pathname.startsWith(MOBILE_API_PREFIX);
}

export function resolveCorsOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  const allowed = parseAllowedOrigins();
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

export function applyMobileApiCorsHeaders(
  response: Response,
  requestOrigin: string | null,
): Response {
  const allowedOrigin = resolveCorsOrigin(requestOrigin);
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.append("Vary", "Origin");
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
