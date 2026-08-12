"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewAppPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await adminApi.createApp({ name, slug });
      setClientKey(result.clientKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create app");
      setLoading(false);
    }
  }

  if (clientKey) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-gray-900">App created</h2>
        <p className="text-sm text-gray-600">
          Your client key is saved and always available on the app detail page.
        </p>
        <Button onClick={() => router.push("/apps")}>Continue to apps</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">New app</h2>
        <Button variant="ghost" asChild>
          <Link href="/apps">Cancel</Link>
        </Button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-lg border border-gray-200 p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          />
          <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create app"}
        </Button>
      </form>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
