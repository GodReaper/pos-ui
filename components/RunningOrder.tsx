"use client";

import type { Order, OrderItem } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface RunningOrderProps {
  tableName: string | null;
  order: Order | null;
  orderLoading: boolean;
  itemUpdatingId: string | null;
  kotLoading: boolean;
  billLoading: boolean;
  paymentLoading: boolean;
  statusMessage: string | null;
  statusVariant?: "success" | "error" | "muted";
  onChangeQty: (item: OrderItem, delta: number) => void;
  onKot: () => Promise<void>;
  onBill: () => Promise<void>;
  onPay: () => Promise<void>;
}

export function RunningOrder({
  tableName,
  order,
  orderLoading,
  itemUpdatingId,
  kotLoading,
  billLoading,
  paymentLoading,
  statusMessage,
  statusVariant = "muted",
  onChangeQty,
  onKot,
  onBill,
  onPay,
}: RunningOrderProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-100">
            {tableName ?? "No table selected"}
          </div>
          <div className="text-[11px] text-slate-400">
            {order
              ? `Order #${order.id.slice(-6)} · ${order.status}`
              : orderLoading
                ? "Loading order…"
                : tableName
                  ? "No active order yet."
                  : "Select a table to view order."}
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-xs">
        {!tableName ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Select a table to manage its order.
          </div>
        ) : orderLoading && !order ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Loading order…
          </div>
        ) : !order ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No active order for this table.
          </div>
        ) : (
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Status:{" "}
                <span className="font-semibold text-slate-100">{order.status}</span>
              </span>
              <span>
                Items:{" "}
                <span className="font-semibold text-slate-100">
                  {order.items.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-slate-950/60 p-1.5">
              {order.items.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  No items yet. Add items from the middle panel.
                </div>
              ) : (
                order.items.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-start justify-between gap-2 rounded-md bg-slate-900/70 px-2 py-1.5"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-medium text-slate-100">
                            {item.name_snapshot}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Qty {item.qty} · ${item.price_snapshot.toFixed(2)}
                            {item.notes ? ` · ${item.notes}` : ""}
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-100 tabular-nums">
                          ${(item.price_snapshot * item.qty).toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 bg-slate-900/80 text-[10px] text-slate-100 disabled:opacity-50"
                          disabled={!!itemUpdatingId}
                          onClick={() => onChangeQty(item, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 bg-slate-900/80 text-[10px] text-slate-100 disabled:opacity-50"
                          disabled={!!itemUpdatingId}
                          onClick={() => onChangeQty(item, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {order && (
              <div className="space-y-1 rounded-lg bg-slate-950/80 p-2 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-slate-100">
                    ${order.totals.sub_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="tabular-nums text-slate-100">
                    ${order.totals.tax_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="tabular-nums text-slate-100">
                    ${order.totals.discount_total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[12px] font-semibold text-slate-100">
                  <span>Total</span>
                  <span className="tabular-nums text-sky-300">
                    ${order.totals.grand_total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
        <div
          className={
            statusVariant === "success"
              ? "text-emerald-400"
              : statusVariant === "error"
                ? "text-rose-400"
                : "text-slate-500"
          }
        >
          {statusMessage}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!order || kotLoading || order.items.length === 0}
            onClick={onKot}
          >
            {kotLoading ? "KOT…" : "KOT"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hidden md:inline-flex"
            disabled
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!order || billLoading || order.items.length === 0}
            onClick={onBill}
          >
            {billLoading ? "Billing…" : "Bill"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hidden md:inline-flex"
            disabled
          >
            E-Bill
          </Button>
          <Button
            size="sm"
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            disabled={!order || paymentLoading || !order || order.totals.grand_total <= 0}
            onClick={onPay}
          >
            {paymentLoading ? "Settling…" : "Settle & Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}


