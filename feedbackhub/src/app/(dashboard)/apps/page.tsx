"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import type { App } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";

export default function AppsPage() {
  const [items, setItems] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listApps();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/apps/new">
            <Plus className="h-4 w-4" />
            New app
          </Link>
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No apps"
          description="Create an app to connect mobile clients."
          action={
            <Button asChild>
              <Link href="/apps/new">Create app</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Client key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/apps/${item.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                  <TableCell className="font-mono text-xs">{item.clientKey.slice(0, 12)}…</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "success" : "secondary"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
