"use client";

import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Menu, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as AuthUser } from "@/lib/auth-client";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/inbox": "Inbox",
  "/questions": "Questions",
  "/integration": "Integration",
  "/apps": "Apps",
  "/answers": "Answers",
  "/team": "Team",
  "/audit-log": "Audit log",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/inbox/")) return "Conversation";
  if (pathname.startsWith("/questions/new")) return "New question";
  if (pathname.startsWith("/questions/")) return "Question";
  if (pathname.startsWith("/apps/new")) return "New app";
  if (pathname.startsWith("/apps/")) return "App";
  return "Feedback Hub";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header({
  user,
  pathname,
  onMenuClick,
  actions,
}: {
  user: AuthUser;
  pathname: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold text-gray-900">{getPageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-gray-700 sm:inline">{user.name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs font-normal text-gray-500">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {user.role}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/change-password")}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleSignOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
