"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { HealthStatus } from "@/lib/admin-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/shared/page-states";

function statusVariant(ok: boolean): "success" | "destructive" {
  return ok ? "success" : "destructive";
}

export default function SettingsPage() {
  const [live, setLive] = useState<HealthStatus | null>(null);
  const [ready, setReady] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [liveStatus, readyStatus] = await Promise.all([
        adminApi.getHealthLive(),
        adminApi.getHealthReady(),
      ]);
      setLive(liveStatus);
      setReady(readyStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system status");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState rows={3} />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const dbOk = ready?.checks?.database === true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">System health and deployment information.</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant(live?.status === "ok")}>
              {live?.status ?? "unknown"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant(ready?.status === "ok")}>
              {ready?.status ?? "unknown"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant(dbOk)}>{dbOk ? "ok" : "error"}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
