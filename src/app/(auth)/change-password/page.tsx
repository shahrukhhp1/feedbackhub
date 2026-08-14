"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/shared/page-states";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    void adminApi
      .getMe()
      .then((me) => setIsRequired(me.user.mustChangePassword))
      .catch(() => router.replace("/login"))
      .finally(() => setCheckingSession(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    if (result.error) {
      setLoading(false);
      setError(result.error.message ?? "Failed to change password");
      return;
    }

    try {
      await adminApi.completePasswordChange();
    } catch {
      // Clearing mustChangePassword is best-effort for voluntary changes
    }

    setLoading(false);
    window.location.assign("/");
  }

  if (checkingSession) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Change password</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isRequired
            ? "You must set a new password before continuing."
            : "Enter your current password and choose a new one."}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
          {!isRequired ? (
            <Button variant="ghost" asChild>
              <Link href="/">Cancel</Link>
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
