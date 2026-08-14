"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { App, Conversation } from "@/lib/admin-types";
import { formatRelativeDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SearchInput,
} from "@/components/shared/page-states";

const statusVariant: Record<string, "default" | "warning" | "secondary"> = {
  open: "default",
  waiting_for_user: "warning",
  closed: "secondary",
};

export default function InboxPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [appId, setAppId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const appNames = useMemo(
    () => Object.fromEntries(apps.map((app) => [app.id, app.name])),
    [apps],
  );

  useEffect(() => {
    void adminApi.listApps().then((res) => setApps(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    void load(true);
  }, [status, appId]);

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listInbox({
        status: status === "all" ? undefined : status,
        appId: appId === "all" ? undefined : appId,
        search: search || undefined,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setCursor(null);
    void load(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search conversations…"
          className="sm:max-w-xs"
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="waiting_for_user">Waiting for user</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={appId} onValueChange={setAppId}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="App" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All apps</SelectItem>
            {apps.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                {app.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && items.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load(true)} />
      ) : items.length === 0 ? (
        <EmptyState title="No conversations" description="Feedback from mobile apps will appear here." />
      ) : (
        <>
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/inbox/${item.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {item.subject}
                      </Link>
                    </TableCell>
                    <TableCell>{appNames[item.appId] ?? item.appId.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status] ?? "secondary"}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatRelativeDate(item.lastMessageAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void load(false)} disabled={loading}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
