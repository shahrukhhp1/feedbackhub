"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { App, Installation } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CopyableText } from "@/components/shared/copyable-text";
import { ErrorState, LoadingState } from "@/components/shared/page-states";

export default function AppDetailPage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<App | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [params.id]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [appData, instRes] = await Promise.all([
        adminApi.getApp(params.id),
        adminApi.listInstallations(params.id, { includeRevoked: true }),
      ]);
      setApp(appData);
      setName(appData.name);
      setStatus(appData.status);
      setInstallations(instRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load app");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await adminApi.updateApp(params.id, { name, status });
      setApp(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleRotateKey() {
    setSaving(true);
    try {
      await adminApi.rotateAppKey(params.id);
      setConfirmRotate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate key");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(installationId: string) {
    setSaving(true);
    try {
      await adminApi.revokeInstallation(installationId);
      setConfirmRevoke(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke installation");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState rows={6} />;
  if (error && !app) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!app) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{app.name}</h2>
        <Button variant="ghost" asChild>
          <Link href="/apps">Back</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-900">Client key</p>
        <p className="mt-1 text-xs text-gray-500">
          Embed this in your mobile app for installation registration.
        </p>
        <CopyableText value={app.clientKey} className="mt-3" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="max-w-lg space-y-4 rounded-lg border border-gray-200 p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setConfirmRotate(true)}>
            Rotate key
          </Button>
        </div>
      </form>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Installations</h3>
        {installations.length === 0 ? (
          <p className="text-sm text-gray-500">No installations yet.</p>
        ) : (
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User GUID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {installations.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-mono text-xs">{inst.userGuid}</TableCell>
                    <TableCell className="text-sm">{inst.contactEmail ?? "—"}</TableCell>
                    <TableCell>{inst.platform ?? "—"}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(inst.lastSeenAt)}</TableCell>
                    <TableCell>
                      <Badge variant={inst.revokedAt ? "destructive" : "success"}>
                        {inst.revokedAt ? "Revoked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!inst.revokedAt ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setConfirmRevoke(inst.id)}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmRotate}
        onOpenChange={setConfirmRotate}
        title="Rotate client key"
        description="The current key will stop working immediately. Mobile apps must be updated with the new key."
        confirmLabel="Rotate key"
        destructive
        loading={saving}
        onConfirm={handleRotateKey}
      />

      <ConfirmDialog
        open={!!confirmRevoke}
        onOpenChange={(open) => !open && setConfirmRevoke(null)}
        title="Revoke installation"
        description="This installation will no longer be able to authenticate."
        confirmLabel="Revoke"
        destructive
        loading={saving}
        onConfirm={() => {
          if (confirmRevoke) void handleRevoke(confirmRevoke);
        }}
      />
    </div>
  );
}
