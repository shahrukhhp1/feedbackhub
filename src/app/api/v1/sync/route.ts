import type { NextRequest } from "next/server";
import { handleMobileRoute } from "@/server/api/handler";
import { parseQuery } from "@/server/api/request";
import { getSyncData } from "@/server/services/sync.service";
import { syncQuerySchema } from "@/server/validation/mobile";

export async function GET(request: NextRequest) {
  return handleMobileRoute(request, "sync", async ({ installation, request }) => {
    const query = parseQuery(request, syncQuerySchema);
    return getSyncData(installation, query.after);
  });
}
