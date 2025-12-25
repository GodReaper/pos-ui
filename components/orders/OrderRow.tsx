"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { OrderListItem } from "@/lib/api/orders";
import { Badge } from "@/components/ui/badge";
import { CancelInline } from "./CancelInline";
import {
  getOrderStatusColors,
  getOrderStatusLabel,
} from "@/lib/pos/orderStatusColors";
import { formatCurrencyINR } from "@/lib/utils";

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

export function OrderRow({
  order,
  isExpanded,
  onToggle,
  canCancel,
  onCancel,
}: OrderRowProps) {
  const [showCancel, setShowCancel] = useState(false);

  const statusLabel = getOrderStatusLabel(order.status);
  const statusColors = getOrderStatusColors(order.status);

  // Prefer full items if present, otherwise use items_preview
  const hasFullItems = Array.isArray((order as any).items) && (order as any).items.length > 0;
  const fullItems =
    hasFullItems ? ((order as any).items as any[]) : [];

  const previewItemsRaw = hasFullItems
    ? fullItems
    : (order.items_preview ?? []);

  // Build a unified preview list for the "Items" chips
  const itemsPreview = previewItemsRaw.slice(0, 3).map((item: any, idx: number) => {
    if (hasFullItems) {
      return {
        key: item.item_id ?? `${idx}`,
        name: item.name_snapshot ?? "Item",
        qty: item.qty ?? 1,
      };
    }
    // items_preview from list API
    return {
      key: `${idx}`,
      name: item.name ?? "Item",
      qty: item.qty ?? 1,
    };
  });

  const totalItemsCount = hasFullItems
    ? fullItems.length
    : (order.items_preview?.length ?? 0);
  const remainingCount = Math.max(0, totalItemsCount - itemsPreview.length);

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
              {formatCurrencyINR(
                order.totals?.grand_total ??
                  (order as any).grand_total ??
                  0,
              )}
            </span>
          </div>

          <div className="hidden flex-1 flex-col md:flex">
            <span className="text-[11px] text-slate-400">Items</span>
            <div className="flex flex-wrap gap-1 text-[11px] text-slate-200">
              {itemsPreview.map((item) => (
                <span
                  key={item.key}
                  className="rounded-full bg-slate-800/80 px-2 py-0.5"
                >
                  {item.name} × {item.qty}
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

          {/* Expanded items list: prefer full items; fall back to items_preview */}
          {hasFullItems ? (
            <div className="space-y-1 text-[11px]">
              {fullItems.map((item: any) => (
                <div
                  key={(item.item_id ?? "") + (item.name_snapshot ?? "")}
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
                      {formatCurrencyINR(item.price_snapshot * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : order.items_preview && order.items_preview.length > 0 ? (
            <div className="space-y-1 text-[11px]">
              {order.items_preview.map((item, idx) => (
                <div
                  key={item.name + idx}
                  className="flex items-center justify-between rounded-md bg-slate-950/60 px-2 py-1"
                >
                  <div className="flex flex-1 items-center gap-2">
                    <span className="font-medium text-slate-100">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-300">×{item.qty}</span>
                    <span className="w-16 text-right text-slate-200">
                      {formatCurrencyINR(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              No items available for this order.
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/40 px-2 py-1.5 text-[11px] text-rose-100">
              <span className="font-semibold">Cancelled.</span>{" "}
              {"cancel_reason" in order && (order as any).cancel_reason && (
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
