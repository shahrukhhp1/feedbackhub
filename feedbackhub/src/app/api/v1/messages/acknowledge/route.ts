import type { NextRequest } from "next/server";
import { handleMobileRoute } from "@/server/api/handler";
import { parseBody } from "@/server/api/request";
import { acknowledgeMessages } from "@/server/repositories/messages";
import { acknowledgeMessagesSchema } from "@/server/validation/mobile";

export async function POST(request: NextRequest) {
  return handleMobileRoute(request, "messages/acknowledge", async ({ installation, request }) => {
    const body = await parseBody(request, acknowledgeMessagesSchema);
    await acknowledgeMessages({
      installationId: installation.id,
      deliveredMessageIds: body.delivered,
      readMessageIds: body.read,
    });
    return { acknowledged: true };
  });
}
