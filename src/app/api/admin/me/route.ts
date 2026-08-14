import type { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/api/handler";
import { requireSession } from "@/server/auth/session";
import { clearMustChangePassword } from "@/server/repositories/users";

export async function GET(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        mustChangePassword: session.user.mustChangePassword,
        image: session.user.image,
      },
    };
  });
}

export async function PATCH(request: NextRequest) {
  return handleAdminRequest(request, async () => {
    const session = await requireSession();
    await clearMustChangePassword(session.user.id);
    return { success: true };
  });
}
