"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ANSWER_TYPES } from "@/shared/constants";
import { adminApi } from "@/lib/admin-api";
import type { App } from "@/lib/admin-types";
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
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/page-states";

export default function NewQuestionPage() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [appId, setAppId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answerType, setAnswerType] = useState<string>(ANSWER_TYPES[0]);
  const [choices, setChoices] = useState("Option A\nOption B");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void adminApi
      .listApps()
      .then((res) => {
        setApps(res.items);
        if (res.items[0]) setAppId(res.items[0].id);
      })
      .catch(() => setError("Failed to load apps"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const needsChoices =
      answerType === "single_choice" || answerType === "multiple_choice";

    try {
      const question = await adminApi.createQuestion({
        appId,
        title,
        description: description || undefined,
        answerType,
        required,
        options: needsChoices
          ? { choices: choices.split("\n").map((c) => c.trim()).filter(Boolean) }
          : undefined,
      });
      router.push(`/questions/${question.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
      setLoading(false);
    }
  }

  const needsChoices = answerType === "single_choice" || answerType === "multiple_choice";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">New question</h2>
        <Button variant="ghost" asChild>
          <Link href="/questions">Cancel</Link>
        </Button>
      </div>

      {error ? <ErrorState message={error} /> : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-lg border border-gray-200 p-6">
        <div className="space-y-2">
          <Label>App</Label>
          <Select value={appId} onValueChange={setAppId}>
            <SelectTrigger>
              <SelectValue placeholder="Select app" />
            </SelectTrigger>
            <SelectContent>
              {apps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Answer type</Label>
          <Select value={answerType} onValueChange={setAnswerType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANSWER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {needsChoices ? (
          <div className="space-y-2">
            <Label htmlFor="choices">Choices (one per line)</Label>
            <Textarea
              id="choices"
              value={choices}
              onChange={(e) => setChoices(e.target.value)}
              rows={4}
            />
          </div>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-gray-300"
          />
          Required
        </label>

        <Button type="submit" disabled={loading || !appId}>
          {loading ? "Creating…" : "Create question"}
        </Button>
      </form>
    </div>
  );
}
