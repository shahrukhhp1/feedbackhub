import { NextRequest } from "next/server";
import { adminAuthState } from "./admin-auth-state";
import type { Role } from "@/shared/constants";
import { createTestAdminUser } from "./helpers";

const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export async function setAdminSessionCookie(email: string, password: string): Promise<void> {
  const { auth } = await import("@/server/auth");
  const response = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  if (!response) {
    throw new Error("Admin sign-in did not return a response");
  }

  const setCookies = response.headers.getSetCookie();
  adminAuthState.cookie = setCookies.map((entry) => entry.split(";")[0]).join("; ");
}

export async function loginAsAdminForApi(role: Role = "superadmin") {
  const creds = await createTestAdminUser(role);
  await setAdminSessionCookie(creds.email, creds.password);
  return creds;
}

export function clearAdminSessionCookie(): void {
  adminAuthState.cookie = "";
}

export function createApiRequest(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): NextRequest {
  const headers = new Headers(options?.headers);
  if (options?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(new URL(path, baseUrl), {
    method: options?.method ?? "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;
  return body;
}

export async function expectJsonOk<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expected HTTP ${response.status} to be OK. Body: ${text}`);
  }
  return readJsonResponse<T>(response);
}
