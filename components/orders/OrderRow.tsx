"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { OrderListItem } from "@/lib/api/orders";
import { Badge } from "@/components/ui/badge";
import { CancelInline } from "./CancelInline";
import { getOrderStatusColors, getOrderStatusLabel } from "@/lib/pos/orderStatusColors";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface OrderRowProps {
  order: OrderListItem;
  isExpanded: boolean;
  onToggle: () => void;
  canCancel: boolean;
  onCancel: (orderId: string, reason: string) => Promise<void>;
}

export function OrderRow({ order, isExpanded, onToggle, canCancel, onCancel }: OrderRowProps) {
  const [showCancel, setShowCancel] = useState(false);

  const statusLabel = getOrderStatusLabel(order.status);
  const statusColors = getOrderStatusColors(order.status);

  const items = order.items ?? [];
  const itemsPreview = items.slice(0, 3);
  const remainingCount = items.length - itemsPreview.length;

  const handleConfirmCancel = async (reason: string) => {
    await onCancel(order.id, reason);
    setShowCancel(false);
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-100">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <div className="flex flex-1 items-center gap-3">
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[11px] text-slate-400">Table / Area</span>
            <span className="text-xs font-semibold">
              {order.table_name ?? "#"} ·{" "}
              <span className="text-slate-300">
                {order.area_name ?? "Area"}
              </span>
            </span>
          </div>

          <div className="flex flex-col min-w-[80px]">
            <span className="text-[11px] text-slate-400">Grand total</span>
            <span className="text-xs font-semibold text-emerald-300">
              {formatCurrency(order.totals?.grand_total ?? 0)}
            </span>
          </div>

          <div className="hidden flex-1 flex-col md:flex">
            <span className="text-[11px] text-slate-400">Items</span>
            <div className="flex flex-wrap gap-1 text-[11px] text-slate-200">
              {itemsPreview.map((item) => (
                <span
                  key={item.item_id}
                  className="rounded-full bg-slate-800/80 px-2 py-0.5"
                >
                  {item.name_snapshot} × {item.qty}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="text-slate-400">
                  +{remainingCount} more
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col min-w-[120px]">
            <span className="text-[11px] text-slate-400">Created</span>
            <span className="text-xs">
              <span className="font-medium">
                {order.biller_username ?? order.created_by}
              </span>{" "}
              ·{" "}
              <span className="text-slate-300">
                {formatTime(order.created_at)}
              </span>
            </span>
          </div>

          <div className="flex justify-end">
            <Badge
              variant="outline"
              className={`border px-2 py-0.5 text-[11px] ${statusColors.badge}`}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Order items
          </div>
            <div className="space-y-1 text-[11px]">
            {items.map((item) => (
              <div
                key={item.item_id + item.name_snapshot}
                className="flex items-center justify-between rounded-md bg-slate-950/60 px-2 py-1"
              >
                <div className="flex flex-1 items-center gap-2">
                  <span className="font-medium text-slate-100">
                    {item.name_snapshot}
                  </span>
                  {item.notes && (
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                      {item.notes}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-300">×{item.qty}</span>
                  <span className="w-16 text-right text-slate-200">
                    {formatCurrency(item.price_snapshot * item.qty)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {order.status === "cancelled" && (
            <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-2 py-1.5 text-[11px] text-rose-100">
              <span className="font-semibold">Cancelled.</span>{" "}
              {("cancel_reason" in order && (order as any).cancel_reason) && (
                <span>Reason: {(order as any).cancel_reason}</span>
              )}
            </div>
          )}

          {canCancel && order.status !== "cancelled" && (
            <>
              {!showCancel ? (
                <button
                  type="button"
                  onClick={() => setShowCancel(true)}
                  className="mt-3 text-[11px] font-medium text-rose-300 hover:text-rose-200"
                >
                  Cancel order
                </button>
              ) : (
                <CancelInline
                  orderId={order.id}
                  onConfirm={handleConfirmCancel}
                  onClose={() => setShowCancel(false)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


