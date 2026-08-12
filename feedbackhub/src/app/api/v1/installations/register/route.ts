import type { NextRequest } from "next/server";
import { handlePublicRoute } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { registerInstallation } from "@/server/services/installations.service";
import { registerInstallationSchema } from "@/server/validation/mobile";

export async function POST(request: NextRequest) {
  return handlePublicRoute(request, "installations/register", async ({ request }) => {
    const body = await parseBody(request, registerInstallationSchema);
    return registerInstallation(body);
  });
}
