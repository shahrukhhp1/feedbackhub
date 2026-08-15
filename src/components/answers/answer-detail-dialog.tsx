"use client";

import type { Answer } from "@/lib/admin-types";
import { formatAnswerJson, formatAnswerValue } from "@/lib/answer-display";
import { formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export function AnswerDetailDialog({
  answer,
  appName,
  open,
  onOpenChange,
}: {
  answer: Answer | null;
  appName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!answer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Answer details</DialogTitle>
          <DialogDescription>Submitted {formatDate(answer.createdAt)}</DialogDescription>
        </DialogHeader>

        <dl className="space-y-3">
          <DetailRow label="Answer" value={formatAnswerValue(answer.answer)} />
          <DetailRow label="Question" value={answer.questionTextSnapshot} />
          <DetailRow label="Type" value={answer.answerType.replace(/_/g, " ")} />
          <DetailRow label="App" value={appName ?? answer.appId} />
          <DetailRow label="User" value={answer.userGuid || answer.installationId} />
          <DetailRow label="Email" value={answer.contactEmail ?? "—"} />
          <DetailRow label="Answer ID" value={answer.id} />
          <DetailRow label="Installation" value={answer.installationId} />
          <DetailRow
            label="Question ID"
            value={answer.questionId ?? answer.externalQuestionKey ?? "—"}
          />
        </dl>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Raw JSON</p>
          <pre className="overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
            {formatAnswerJson(answer.answer)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
