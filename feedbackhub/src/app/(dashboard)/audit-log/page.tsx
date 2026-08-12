"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { adminApi } from "@/lib/admin-api";
import type { AuditLogEntry } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PermissionDeniedState,
} from "@/components/shared/page-states";

export default function AuditLogPage() {
  const { data: session } = authClient.useSession();
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const isSuperadmin = session?.user?.role === "superadmin";

  useEffect(() => {
    if (isSuperadmin) void load(true);
    else setLoading(false);
  }, [isSuperadmin]);

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listAuditLogs({
        action: action || undefined,
        entityType: entityType || undefined,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }

  if (!isSuperadmin) return <PermissionDeniedState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Input id="action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. app.create" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entityType">Entity type</Label>
          <Input
            id="entityType"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="e.g. app"
          />
        </div>
        <Button variant="outline" onClick={() => void load(true)}>
          Apply filters
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <LoadingState />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => void load(true)} />
      ) : items.length === 0 ? (
        <EmptyState title="No audit events" description="Administrative actions will be logged here." />
      ) : (
        <>
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-gray-500">{formatDate(entry.createdAt)}</TableCell>
                    <TableCell>{entry.actorUserId?.slice(0, 8) ?? "System"}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                    <TableCell>
                      {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId}` : ""}
                    </TableCell>
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
