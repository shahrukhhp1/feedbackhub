import "server-only";

import { ApiError } from "@/server/api/errors";
import { getAppByIdForAuth } from "@/server/repositories/apps";
import {
  registerOrUpdateInstallation,
  type Installation,
} from "@/server/repositories/installations";
import { generateToken, hashToken, normalizeEmail, verifyClientKey } from "@/server/security/crypto";
import type { RegisterInstallationInput } from "@/server/validation/mobile";

export type RegisterInstallationResult = {
  installationId: string;
  token: string;
};

export async function registerInstallation(
  input: RegisterInstallationInput,
): Promise<RegisterInstallationResult> {
  const app = await getAppByIdForAuth(input.appId);
  if (!app) {
    throw ApiError.notFound("App not found");
  }

  if (app.status !== "active") {
    throw ApiError.forbidden("App is not active");
  }

  if (!verifyClientKey(input.clientKey, app.clientKey)) {
    throw ApiError.unauthorized("Invalid client key");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);

  const installation = await registerOrUpdateInstallation({
    appId: input.appId,
    userGuid: input.userGuid,
    tokenHash,
    contactEmail: input.contactEmail ? normalizeEmail(input.contactEmail) : undefined,
    platform: input.platform,
    appVersion: input.appVersion,
    locale: input.locale,
    timezone: input.timezone,
  });

  return {
    installationId: installation.id,
    token,
  };
}

export type AuthenticatedInstallation = {
  installation: Installation;
  appId: string;
};
