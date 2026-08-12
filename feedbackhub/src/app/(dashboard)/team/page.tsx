"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { adminApi } from "@/lib/admin-api";
import type { TeamUser } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { ROLES, type Role } from "@/shared/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PermissionDeniedState,
} from "@/components/shared/page-states";

export default function TeamPage() {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");

  const isSuperadmin = session?.user?.role === "superadmin";

  useEffect(() => {
    if (isSuperadmin) void load();
    else setLoading(false);
  }, [isSuperadmin]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listTeam();
      setUsers(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setActionLoading(true);
    try {
      const result = await adminApi.createTeamUser({ name, email, role });
      setTempPassword(result.temporaryPassword);
      setCreateOpen(false);
      setName("");
      setEmail("");
      setRole("admin");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisable(userId: string) {
    setActionLoading(true);
    try {
      await adminApi.disableTeamUser(userId);
      setConfirmDisable(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEnable(userId: string) {
    setActionLoading(true);
    try {
      await adminApi.enableTeamUser(userId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    try {
      await adminApi.updateTeamRole(userId, newRole);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  if (!isSuperadmin) return <PermissionDeniedState />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      {tempPassword ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-gray-900">Temporary password — copy now</p>
          <code className="mt-2 block font-mono text-sm">{tempPassword}</code>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => setTempPassword(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : error && users.length === 0 ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : users.length === 0 ? (
        <EmptyState title="No team members" description="Add admin users to manage Feedback Hub." />
      ) : (
        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => void handleRoleChange(user.id, value as Role)}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.disabledAt ? "destructive" : "success"}>
                      {user.disabledAt ? "Disabled" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.disabledAt ? (
                      <Button variant="ghost" size="sm" onClick={() => void handleEnable(user.id)}>
                        Enable
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setConfirmDisable(user.id)}
                      >
                        Disable
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={actionLoading || !name || !email}>
              {actionLoading ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDisable}
        onOpenChange={(open) => !open && setConfirmDisable(null)}
        title="Disable user"
        description="This user will no longer be able to sign in."
        confirmLabel="Disable"
        destructive
        loading={actionLoading}
        onConfirm={() => {
          if (confirmDisable) void handleDisable(confirmDisable);
        }}
      />
    </div>
  );
}
