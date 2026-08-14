import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
