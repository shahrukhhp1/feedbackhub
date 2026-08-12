import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/api/errors";
import { getEnv } from "@/server/env";

const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(request: NextRequest): string {
  return request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
}

export function getClientIp(request: NextRequest): string {
  if (getEnv().TRUST_PROXY) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }

    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  return "unknown";
}

export async function parseBody<T>(request: NextRequest, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw ApiError.validation("Request body must be valid JSON");
  }

  return parseValue(body, schema, "Request body");
}

export function parseQuery<T>(request: NextRequest, schema: z.ZodType<T>): T {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  return parseValue(query, schema, "Query parameters");
}

function parseValue<T>(value: unknown, schema: z.ZodType<T>, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw ApiError.validation(`${label} are invalid`, result.error.flatten());
  }
  return result.data;
}
