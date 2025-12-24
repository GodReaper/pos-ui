 "use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { Area, Table, Order, OrderItem } from "@/lib/api/types";
import { TableGrid } from "@/components/TableGrid";
import type { BillerTable } from "@/components/TableCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

/**
 * Biller main screen - table canvas
 */
export default function BillerPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [tables, setTables] = useState<BillerTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<BillerTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [kotLoading, setKotLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [itemUpdatingId, setItemUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        setAreasLoading(true);
        const data = await apiClient.get<Area[]>("/areas");
        const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order);
        setAreas(sorted);
        if (!selectedAreaId && sorted.length > 0) {
          setSelectedAreaId(sorted[0].id);
        }
      } catch (error: any) {
        showToast(error.message || "Failed to load areas", "error");
      } finally {
        setAreasLoading(false);
      }
    };

    loadAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedAreaId) return;

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadTables = async (withLoading = false) => {
      try {
        if (withLoading) {
          setTablesLoading(true);
        }
        const data = await apiClient.get<(Table & { running_total?: number | null })[]>(
          `/areas/${selectedAreaId}/tables`
        );
        if (!isCancelled) {
          setTables(data);
          if (selectedTable && !data.find((t) => t.id === selectedTable.id)) {
            setSelectedTable(null);
          }
        }
      } catch (error: any) {
        if (!isCancelled) {
          showToast(error.message || "Failed to load tables", "error");
        }
      } finally {
        if (!isCancelled) {
          setTablesLoading(false);
        }
      }
    };

    // Initial load with loader
    loadTables(true);

    intervalId = setInterval(() => {
      loadTables(false);
    }, 2000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedAreaId, selectedTable]);

  // When a table is selected, open or resume its order and start polling current order
  useEffect(() => {
    if (!selectedTable) {
      setCurrentOrder(null);
      return;
    }

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadCurrentOrder = async (withOpen: boolean) => {
      try {
        setOrderLoading(true);

        let order: Order | null = null;

        if (withOpen) {
          // Open a new order or get existing open order
          order = await apiClient.post<Order>(`/tables/${selectedTable.id}/open`);
        } else {
          // Refresh current order snapshot
          order = await apiClient.get<Order | null>(`/tables/${selectedTable.id}/current`);
        }

        if (!isCancelled) {
          setCurrentOrder(order);
        }
      } catch (error: any) {
        if (!isCancelled) {
          showToast(error.message || "Failed to load order", "error");
        }
      } finally {
        if (!isCancelled) {
          setOrderLoading(false);
        }
      }
    };

    // First time: ensure order is opened/resumed
    loadCurrentOrder(true);

    // Then poll current order every 2s
    intervalId = setInterval(() => {
      loadCurrentOrder(false);
    }, 2000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedTable]);

  const updateOrderItem = async (item: OrderItem, qtyDelta: number) => {
    if (!currentOrder || itemUpdatingId) return;

    try {
      setItemUpdatingId(item.item_id);
      const updated = await apiClient.post<Order>(`/orders/${currentOrder.id}/items`, {
        item_id: item.item_id,
        qty_delta: qtyDelta,
      });
      setCurrentOrder(updated);
    } catch (error: any) {
      showToast(error.message || "Failed to update item", "error");
    } finally {
      setItemUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] gap-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 lg:p-6">
      {/* Left: Areas + table grid */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-50">
              Dining Area
            </h2>
            <p className="text-xs text-slate-400">
              Tap a table to start or continue an order.
            </p>
          </div>

          {selectedAreaId && (
            <Badge variant="outline" className="border-slate-700 bg-slate-900/60 text-[11px]">
              Updating every 2s
            </Badge>
          )}
        </div>

        {/* Area selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {areasLoading && areas.length === 0 ? (
            <span className="text-xs text-slate-500">Loading areas…</span>
          ) : areas.length === 0 ? (
            <span className="text-xs text-slate-500">
              No areas configured. Please add areas in admin.
            </span>
          ) : (
            areas.map((area) => (
              <Button
                key={area.id}
                type="button"
                size="sm"
                variant={area.id === selectedAreaId ? "default" : "ghost"}
                className={cn(
                  "rounded-full px-3 text-xs font-medium",
                  area.id === selectedAreaId
                    ? "bg-sky-600 text-slate-50 hover:bg-sky-500"
                    : "text-slate-300 hover:bg-slate-800"
                )}
                onClick={() => setSelectedAreaId(area.id)}
              >
                {area.name}
              </Button>
            ))
          )}
        </div>

        {/* Table grid */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-3 lg:p-4">
          <TableGrid
            tables={tables}
            selectedTableId={selectedTable?.id ?? null}
            isLoading={tablesLoading}
            onSelectTable={(table) => setSelectedTable(table)}
          />
        </div>
      </div>

      {/* Right: Inline order panel */}
      <div className="hidden w-[360px] flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-4 lg:flex">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-50">
              {selectedTable ? selectedTable.name : "No table selected"}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedTable
                ? currentOrder
                  ? `Order #${currentOrder.id.slice(-6)} · Status: ${currentOrder.status}`
                  : orderLoading
                    ? "Loading order…"
                    : "No active order yet. Opening order…"
                : "Select a table on the left to view or start an order."}
            </p>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
          {!selectedTable ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              Select a table to manage its order.
            </div>
          ) : orderLoading && !currentOrder ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              Loading order…
            </div>
          ) : !currentOrder ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              No active order for this table.
            </div>
          ) : (
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: <span className="font-semibold text-slate-100">{currentOrder.status}</span></span>
                <span>
                  Items:{" "}
                  <span className="font-semibold text-slate-100">
                    {currentOrder.items.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-slate-950/60 p-2">
                {currentOrder.items.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    No items yet. Use another screen to add items.
                  </div>
                ) : (
                  currentOrder.items.map((item) => (
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
                            onClick={() => updateOrderItem(item, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center rounded border border-slate-700 bg-slate-900/80 text-[10px] text-slate-100 disabled:opacity-50"
                            disabled={!!itemUpdatingId}
                            onClick={() => updateOrderItem(item, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-1 rounded-lg bg-slate-950/80 p-2 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-slate-100">
                    ${currentOrder.totals.sub_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="tabular-nums text-slate-100">
                    ${currentOrder.totals.tax_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="tabular-nums text-slate-100">
                    ${currentOrder.totals.discount_total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-[12px] font-semibold text-slate-100">
                  <span>Total</span>
                  <span className="tabular-nums text-sky-300">
                    ${currentOrder.totals.grand_total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedTable && currentOrder && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400">
              Grand Total:{" "}
              <span className="font-semibold text-slate-50">
                ${currentOrder.totals.grand_total.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={kotLoading || currentOrder.items.length === 0}
                onClick={async () => {
                  try {
                    setKotLoading(true);
                    await apiClient.post(`/orders/${currentOrder.id}/kot`);
                    showToast("KOT printed", "success");
                  } catch (error: any) {
                    showToast(error.message || "Failed to print KOT", "error");
                  } finally {
                    setKotLoading(false);
                  }
                }}
              >
                {kotLoading ? "Printing..." : "KOT"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={billLoading || currentOrder.items.length === 0}
                onClick={async () => {
                  try {
                    setBillLoading(true);
                    await apiClient.post(`/orders/${currentOrder.id}/bill`);
                    showToast("Bill printed", "success");
                  } catch (error: any) {
                    showToast(error.message || "Failed to print bill", "error");
                  } finally {
                    setBillLoading(false);
                  }
                }}
              >
                {billLoading ? "Printing..." : "Bill"}
              </Button>
              <Button
                size="sm"
                disabled={paymentLoading || currentOrder.totals.grand_total <= 0}
                onClick={async () => {
                  try {
                    setPaymentLoading(true);
                    await apiClient.post(`/orders/${currentOrder.id}/payment`, [
                      {
                        amount: currentOrder.totals.grand_total,
                        method: "cash",
                        notes: "POS web full payment",
                      },
                    ]);
                    showToast("Payment processed", "success");
                  } catch (error: any) {
                    showToast(error.message || "Failed to process payment", "error");
                  } finally {
                    setPaymentLoading(false);
                  }
                }}
              >
                {paymentLoading ? "Paying..." : "Settle"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
