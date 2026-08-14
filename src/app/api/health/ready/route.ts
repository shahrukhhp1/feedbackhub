import { NextResponse } from "next/server";
import { getRequestId } from "@/server/api/request";
import { checkDatabaseConnection } from "@/server/db";

export async function GET(request: Request) {
  const requestId = getRequestId(request as import("next/server").NextRequest);
  const dbReady = await checkDatabaseConnection();

  if (!dbReady) {
    return NextResponse.json(
      { status: "unavailable", checks: { database: false } },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }

  return NextResponse.json(
    { status: "ok", checks: { database: true } },
    { headers: { "x-request-id": requestId } },
  );
}
