import { NextResponse } from "next/server";
import { getRequestId } from "@/server/api/request";

export async function GET(request: Request) {
  const requestId = getRequestId(request as import("next/server").NextRequest);
  return NextResponse.json(
    { status: "ok" },
    { headers: { "x-request-id": requestId } },
  );
}
