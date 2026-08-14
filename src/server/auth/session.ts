import "server-only";

import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { ApiError } from "@/server/errors";
import type { Role } from "@/shared/constants";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required");
  }

  if (session.user.disabledAt) {
    throw new ApiError("FORBIDDEN", "Account is disabled");
  }

  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const userRole = session.user.role as Role;

  if (!roles.includes(userRole)) {
    throw new ApiError("FORBIDDEN", "Insufficient permissions");
  }

  return session;
}
