import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { parseQuery } from "@/server/api/request";
import { requireSession } from "@/server/auth/session";
import { listAnswersForAdmin } from "@/server/services/answers.service";
import { listAnswersQuerySchema } from "@/server/validation/admin";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    const query = parseQuery(request, listAnswersQuerySchema);
    return listAnswersForAdmin(session.user.id, session.user.role, query);
  });
}
