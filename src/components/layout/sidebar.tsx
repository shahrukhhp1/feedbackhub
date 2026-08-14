"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Plug,
  ScrollText,
  Settings,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/shared/constants";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superadminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/questions", label: "Questions", icon: MessageSquare },
  { href: "/integration", label: "Integration", icon: Plug },
  { href: "/apps", label: "Apps", icon: Smartphone },
  { href: "/answers", label: "Answers", icon: ClipboardList },
  { href: "/team", label: "Team", icon: Users, superadminOnly: true },
  { href: "/audit-log", label: "Audit log", icon: ScrollText, superadminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {navItems.map((item) => {
        if (item.superadminOnly && role !== "superadmin") return null;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  role,
  mobileOpen,
  onMobileClose,
}: {
  role: Role;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <FileText className="h-5 w-5 text-blue-600" />
            Feedback Hub
          </Link>
          <button
            type="button"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={onMobileClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavLinks role={role} onNavigate={onMobileClose} />
      </aside>
    </>
  );
}
