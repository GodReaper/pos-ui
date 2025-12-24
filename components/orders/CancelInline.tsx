"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CancelInlineProps {
  orderId: string;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
  disabled?: boolean;
}

export function CancelInline({ orderId: _orderId, onConfirm, onClose, disabled }: CancelInlineProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for cancelling this order.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/40 p-3">
      <p className="mb-2 text-xs font-medium text-rose-100">
        Cancel order
      </p>
      <Textarea
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Enter cancellation reason (required)"
        className="min-h-[72px] resize-none border-rose-700/60 bg-slate-950/70 text-xs"
        disabled={disabled || submitting}
      />
      {error && (
        <p className="mt-1 text-xs text-rose-300">
          {error}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleSubmit}
          disabled={disabled || submitting}
          className="h-7 px-3 text-[11px]"
        >
          {submitting ? "Cancelling..." : "Confirm Cancel"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-[11px] text-slate-300 hover:text-slate-50"
          onClick={onClose}
          disabled={disabled || submitting}
        >
          Close
        </Button>
      </div>
    </div>
  );
}


