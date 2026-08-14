"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { DashboardOverview } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/shared/page-states";

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getOverview();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Open feedback" value={stats.openConversations} href="/inbox?status=open" />
        <StatCard
          title="Waiting for user"
          value={stats.waitingForUserConversations}
          href="/inbox?status=waiting_for_user"
        />
        <StatCard title="Answers (7 days)" value={stats.answersLast7Days} href="/answers" />
        <StatCard title="Answers (30 days)" value={stats.answersLast30Days} href="/answers" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent activity</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity.</p>
        ) : (
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentActivity.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.action}</TableCell>
                    <TableCell>
                      {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(entry.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-gray-300">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
