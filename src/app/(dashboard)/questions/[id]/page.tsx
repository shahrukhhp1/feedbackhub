"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { Question } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/shared/page-states";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    void load();
  }, [params.id]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getQuestion(params.id);
      setQuestion(data);
      setTitle(data.title);
      setDescription(data.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateQuestion(params.id, {
        title,
        description: description || null,
      });
      setQuestion(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: "activate" | "pause" | "archive" | "duplicate") {
    setSaving(true);
    try {
      let updated: Question;
      if (action === "activate") updated = await adminApi.activateQuestion(params.id);
      else if (action === "pause") updated = await adminApi.pauseQuestion(params.id);
      else if (action === "archive") {
        updated = await adminApi.archiveQuestion(params.id);
        setConfirmArchive(false);
      } else {
        const dup = await adminApi.duplicateQuestion(params.id);
        window.location.href = `/questions/${dup.id}`;
        return;
      }
      setQuestion(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState rows={5} />;
  if (error && !question) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!question) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{question.title}</h2>
          <Badge variant="secondary">{question.status}</Badge>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/questions">Back</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-900">Type:</span>{" "}
          {question.answerType.replace(/_/g, " ")}
        </p>
        <p className="mt-1">
          <span className="font-medium text-gray-900">Updated:</span> {formatDate(question.updatedAt)}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="space-y-4 rounded-lg border border-gray-200 p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {question.status === "draft" || question.status === "paused" ? (
            <Button type="button" variant="outline" onClick={() => void handleAction("activate")}>
              Activate
            </Button>
          ) : null}
          {question.status === "active" ? (
            <Button type="button" variant="outline" onClick={() => void handleAction("pause")}>
              Pause
            </Button>
          ) : null}
          {question.status !== "archived" ? (
            <Button type="button" variant="outline" onClick={() => setConfirmArchive(true)}>
              Archive
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void handleAction("duplicate")}>
            Duplicate
          </Button>
        </div>
      </form>

      {question.options?.choices ? (
        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Choices</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
            {question.options.choices.map((choice) => (
              <li key={choice}>{choice}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive question"
        description="Archived questions will no longer be shown to mobile users."
        confirmLabel="Archive"
        destructive
        loading={saving}
        onConfirm={() => handleAction("archive")}
      />
    </div>
  );
}
