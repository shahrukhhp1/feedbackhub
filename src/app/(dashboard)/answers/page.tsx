"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AnswerDetailDialog } from "@/components/answers/answer-detail-dialog";
import { adminApi } from "@/lib/admin-api";
import type { Answer, App } from "@/lib/admin-types";
import { formatAnswerValue, truncateWords } from "@/lib/answer-display";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page-states";

export default function AnswersPage() {
  const [items, setItems] = useState<Answer[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [appId, setAppId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

  const appNames = useMemo(
    () => Object.fromEntries(apps.map((app) => [app.id, app.name])),
    [apps],
  );

  const uniqueUserCount = useMemo(
    () => new Set(items.map((item) => item.userGuid || item.installationId)).size,
    [items],
  );

  useEffect(() => {
    void adminApi.listApps().then((res) => setApps(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    void load(true);
  }, [appId]);

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listAnswers({
        appId: appId === "all" ? undefined : appId,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load answers");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (appId === "all" || !from || !to) {
      setError("Select an app and date range to export");
      return;
    }
    try {
      const blob = await adminApi.exportAnswers({
        appId,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `answers-${appId}-${from.slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <Label>App</Label>
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
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => void load(true)}>
          Apply filters
        </Button>
        <Button variant="outline" onClick={() => void handleExport()}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {error && items.length > 0 ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading && items.length === 0 ? (
        <LoadingState />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => void load(true)} />
      ) : items.length === 0 ? (
        <EmptyState title="No answers" description="Answers submitted by mobile users will appear here." />
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {items.length} answer{items.length === 1 ? "" : "s"} from {uniqueUserCount} user
            {uniqueUserCount === 1 ? "" : "s"}
          </p>
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedAnswer(item)}
                  >
                    <TableCell className="max-w-[10rem]">
                      <p
                        className="truncate font-mono text-xs text-gray-900"
                        title={item.userGuid || item.installationId}
                      >
                        {item.userGuid || `${item.installationId.slice(0, 8)}…`}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-sm text-gray-700">
                      {item.contactEmail ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[12rem]">
                      <p className="truncate text-sm font-medium" title={item.questionTextSnapshot}>
                        {truncateWords(item.questionTextSnapshot)}
                      </p>
                    </TableCell>
                    <TableCell>{appNames[item.appId] ?? item.appId.slice(0, 8)}</TableCell>
                    <TableCell>{item.answerType.replace(/_/g, " ")}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-900">
                      {formatAnswerValue(item.answer)}
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(item.createdAt)}</TableCell>
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

      <AnswerDetailDialog
        answer={selectedAnswer}
        appName={selectedAnswer ? appNames[selectedAnswer.appId] : undefined}
        open={selectedAnswer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAnswer(null);
        }}
      />
    </div>
  );
}
