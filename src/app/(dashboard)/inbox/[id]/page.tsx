"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { ConversationDetailResponse, Message } from "@/lib/admin-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/shared/page-states";

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    void load();
  }, [params.id]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getConversation(params.id);
      setDetail(data);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const message = await adminApi.replyToConversation(params.id, reply.trim());
      setMessages((prev) => [...prev, message]);
      setReply("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    setActionLoading(true);
    try {
      await adminApi.closeConversation(params.id);
      setConfirmClose(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close conversation");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopen() {
    setActionLoading(true);
    try {
      await adminApi.reopenConversation(params.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reopen conversation");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <LoadingState rows={6} />;
  if (error && !detail) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!detail) return null;

  const { conversation, installation, answer } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{conversation.subject}</h2>
            <Badge variant="secondary">{conversation.status.replace(/_/g, " ")}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">{formatDate(conversation.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {conversation.status === "closed" ? (
            <Button variant="outline" onClick={() => void handleReopen()} disabled={actionLoading}>
              Reopen
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setConfirmClose(true)} disabled={actionLoading}>
              Close
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push("/inbox")}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-gray-200">
            <div className="max-h-[480px] space-y-0 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border-b border-gray-100 py-3 last:border-0">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {message.senderType === "admin"
                          ? "Admin"
                          : message.senderType === "system"
                            ? "System"
                            : "User"}
                      </span>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-900">{message.body}</p>
                  </div>
                ))
              )}
            </div>
            {conversation.status !== "closed" ? (
              <>
                <Separator />
                <div className="space-y-3 p-4">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    rows={3}
                  />
                  <Button onClick={() => void handleReply()} disabled={sending || !reply.trim()}>
                    {sending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          {answer ? (
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Answer context</h3>
              <p className="mt-2 text-sm text-gray-600">{answer.questionTextSnapshot}</p>
              <p className="mt-2 font-mono text-xs text-gray-500">{JSON.stringify(answer.answer)}</p>
            </div>
          ) : null}
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Installation</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Contact email</dt>
                <dd className="break-all text-sm">{installation.contactEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">User GUID</dt>
                <dd className="break-all font-mono text-xs">{installation.userGuid}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Platform</dt>
                <dd>{installation.platform ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">App version</dt>
                <dd>{installation.appVersion ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last seen</dt>
                <dd>{formatDate(installation.lastSeenAt)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close conversation"
        description="The user will no longer be able to send messages until reopened."
        confirmLabel="Close"
        destructive
        loading={actionLoading}
        onConfirm={handleClose}
      />
    </div>
  );
}
