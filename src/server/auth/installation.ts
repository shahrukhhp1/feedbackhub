import "server-only";

import type { NextRequest } from "next/server";
import { ApiError } from "@/server/api/errors";
import { getAppByIdForAuth } from "@/server/repositories/apps";
import { getInstallationByTokenHash } from "@/server/repositories/installations";
import type { Installation } from "@/server/repositories/installations";
import type { App } from "@/server/repositories/apps";
import { hashToken } from "@/server/security/crypto";

export type AuthenticatedInstallationContext = {
  installation: Installation;
  app: App;
};

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function authenticateInstallation(
  request: NextRequest,
): Promise<AuthenticatedInstallationContext> {
  const token = extractBearerToken(request);
  if (!token) {
    throw ApiError.unauthorized("Installation token required");
  }

  const tokenHash = hashToken(token);
  const installation = await getInstallationByTokenHash(tokenHash);
  if (!installation) {
    throw ApiError.unauthorized("Invalid or revoked installation token");
  }

  const app = await getAppByIdForAuth(installation.appId);
  if (!app || app.status !== "active") {
    throw ApiError.forbidden("App is not available");
  }

  return { installation, app };
}
