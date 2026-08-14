"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to send reset email");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
        <p className="mt-2 text-sm text-gray-500">
          If an account exists for that email, we sent password reset instructions.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we will send reset instructions.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <Link href="/login" className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700">
        Back to sign in
      </Link>
    </div>
  );
}
