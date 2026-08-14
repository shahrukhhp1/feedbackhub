"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyableText({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <code className="min-w-0 flex-1 break-all font-mono text-xs">{value}</code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 shrink-0 gap-1.5 px-2 text-xs"
        onClick={() => void handleCopy()}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
