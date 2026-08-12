"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { User } from "@/lib/auth-client";
import type { Role } from "@/shared/constants";

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        role={user.role as Role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          pathname={pathname}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1400px] p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
