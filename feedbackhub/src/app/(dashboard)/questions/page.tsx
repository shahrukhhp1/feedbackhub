"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import type { App, Question } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";

const statusVariant: Record<string, "default" | "warning" | "secondary" | "success"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  archived: "secondary",
};

export default function QuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [appId, setAppId] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminApi.listApps().then((res) => setApps(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    void load();
  }, [appId, status]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listQuestions({
        appId: appId === "all" ? undefined : appId,
        status: status === "all" ? undefined : status,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/questions/new">
            <Plus className="h-4 w-4" />
            New question
          </Link>
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No questions"
          description="Create a question to collect feedback from mobile apps."
          action={
            <Button asChild>
              <Link href="/questions/new">Create question</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/questions/${item.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>{item.answerType.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[item.status] ?? "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(item.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
