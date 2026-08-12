import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { requireSession } from "@/server/auth/session";
import { getDashboardOverview } from "@/server/services/dashboard.service";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    await requireSession();
    return getDashboardOverview();
  });
}
