"use client";

import { useMemo, useState } from "react";
import type { Order, OrderPayment } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PaymentMethod = "cash" | "upi" | "card";

interface SplitRow {
  id: number;
  method: PaymentMethod;
  amount: string;
}

interface PaymentBarProps {
  order: Order | null;
  onPaid: (updatedOrder: Order) => void;
  onStatus?: (message: string, variant: "success" | "error" | "muted") => void;
}

export function PaymentBar({ order, onPaid, onStatus }: PaymentBarProps) {
  const [mode, setMode] = useState<"quick" | "split">("quick");
  const [loading, setLoading] = useState(false);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([
    { id: 1, method: "cash", amount: "" },
    { id: 2, method: "card", amount: "" },
  ]);

  const grandTotal = order?.totals.grand_total ?? 0;
  const isBilled = order?.status === "billed";

  const splitSum = useMemo(
    () =>
      splitRows.reduce((sum, row) => {
        const v = parseFloat(row.amount || "0");
        return sum + (isNaN(v) ? 0 : v);
      }, 0),
    [splitRows]
  );

  const splitValid =
    grandTotal > 0 && Math.abs(splitSum - grandTotal) < 0.01 && splitRows.length > 0;

  if (!order || !isBilled) {
    return null;
  }

  const sendQuickPayment = async (method: PaymentMethod) => {
    if (!order || grandTotal <= 0) return;
    try {
      setLoading(true);
      const body: OrderPayment[] = [
        {
          amount: grandTotal,
          method,
          paid_at: new Date().toISOString(),
          notes: `POS ${method} payment`,
        },
      ];
      const updated = await apiClient.post<Order>(`/orders/${order.id}/payment`, body);
      onPaid(updated);
      onStatus?.("Payment processed", "success");
    } catch (error: any) {
      onStatus?.(error.message || "Failed to process payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendSplitPayment = async () => {
    if (!order || !splitValid) return;
    try {
      setLoading(true);
      const body: OrderPayment[] = splitRows.map((row) => ({
        amount: parseFloat(row.amount || "0"),
        method: row.method,
        paid_at: new Date().toISOString(),
        notes: "POS split payment",
      }));
      const updated = await apiClient.post<Order>(`/orders/${order.id}/payment`, body);
      onPaid(updated);
      onStatus?.("Payment processed", "success");
    } catch (error: any) {
      onStatus?.(error.message || "Failed to process payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Payment · <span className="font-semibold text-slate-100">${grandTotal.toFixed(2)}</span>
        </span>
        <div className="flex gap-1 rounded-full bg-slate-900/80 p-0.5 text-[10px]">
          <button
            type="button"
            className={cn(
              "rounded-full px-2 py-0.5",
              mode === "quick" ? "bg-sky-600 text-slate-950" : "text-slate-300"
            )}
            onClick={() => setMode("quick")}
          >
            Quick
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-2 py-0.5",
              mode === "split" ? "bg-sky-600 text-slate-950" : "text-slate-300"
            )}
            onClick={() => setMode("split")}
          >
            Split
          </button>
        </div>
      </div>

      {mode === "quick" ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            disabled={loading}
            onClick={() => sendQuickPayment("cash")}
          >
            {loading ? "Processing…" : "Cash"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => sendQuickPayment("upi")}
          >
            UPI
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => sendQuickPayment("card")}
          >
            Card
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-[11px]">
          {splitRows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-slate-700 bg-slate-900/90 px-2 text-[11px] text-slate-100"
                value={row.method}
                onChange={(e) =>
                  setSplitRows((rows) =>
                    rows.map((r) =>
                      r.id === row.id ? { ...r, method: e.target.value as PaymentMethod } : r
                    )
                  )
                }
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
              <Input
                type="number"
                step="0.01"
                className="h-8 w-24 border-slate-700 bg-slate-900/90 px-2 text-[11px]"
                value={row.amount}
                onChange={(e) =>
                  setSplitRows((rows) =>
                    rows.map((r) => (r.id === row.id ? { ...r, amount: e.target.value } : r))
                  )
                }
                placeholder="0.00"
              />
              {splitRows.length > 1 && (
                <button
                  type="button"
                  className="text-[11px] text-slate-500 hover:text-rose-400"
                  onClick={() =>
                    setSplitRows((rows) => rows.filter((r) => r.id !== row.id))
                  }
                >
                  Remove
                </button>
              )}
              {index === splitRows.length - 1 && (
                <button
                  type="button"
                  className="ml-auto text-[11px] text-sky-400 hover:text-sky-300"
                  onClick={() =>
                    setSplitRows((rows) => [
                      ...rows,
                      {
                        id: Date.now(),
                        method: "cash",
                        amount: "",
                      },
                    ])
                  }
                >
                  + Add Row
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-slate-400">
              Total entered:{" "}
              <span className="font-semibold text-slate-100">
                ${splitSum.toFixed(2)}
              </span>
            </span>
            <Button
              size="sm"
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              disabled={loading || !splitValid}
              onClick={sendSplitPayment}
            >
              {loading ? "Processing…" : "Complete"}
            </Button>
          </div>
          {!splitValid && grandTotal > 0 && (
            <div className="text-[10px] text-amber-400">
              Split amounts must add up to ${grandTotal.toFixed(2)}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}


