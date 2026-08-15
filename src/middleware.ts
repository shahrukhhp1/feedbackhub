import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  applyMobileApiCorsHeaders,
  createMobileApiPreflightResponse,
  isMobileApiPath,
} from "@/server/api/cors";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  if (isMobileApiPath(pathname) && request.method === "OPTIONS") {
    return createMobileApiPreflightResponse(origin);
  }

  const requestId = request.headers.get("x-request-id") ?? uuidv4();
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  response.headers.set("x-request-id", requestId);

  if (!isMobileApiPath(pathname)) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'",
    );
  }

  if (isMobileApiPath(pathname)) {
    applyMobileApiCorsHeaders(response, origin);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
