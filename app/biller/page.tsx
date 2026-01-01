"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import type { Area, Table, Order, OrderItem } from "@/lib/api/types";
import { TableGrid } from "@/components/TableGrid";
import type { BillerTable } from "@/components/TableCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { RunningOrder, clearRunningKotSnapshot } from "@/components/RunningOrder";
import { PaymentBar } from "@/components/PaymentBar";

/**
 * Biller main screen - table canvas
 */
export default function BillerPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [tables, setTables] = useState<BillerTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<BillerTable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [itemUpdatingId, setItemUpdatingId] = useState<string | null>(null);
  const [kotLoading, setKotLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<
    "success" | "error" | "muted"
  >("muted");

  // refs to help with polling logic
  const fetchedTotalsRef = useRef<Set<string>>(new Set());
  const tablesRef = useRef<BillerTable[]>([]);

  // keep ref in sync with state
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

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

  // Load tables for selected area, poll every 2s (single API),
  // and fetch running_total once per occupied table.
  useEffect(() => {
    if (!selectedAreaId) return;

    // new area -> reset fetched totals map
    fetchedTotalsRef.current = new Set();

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadTables = async (withLoading = false) => {
      try {
        if (withLoading) {
          setTablesLoading(true);
        }

        const data = await apiClient.get<
          (Table & { running_total?: number | null })[]
        >(`/areas/${selectedAreaId}/tables`);

        if (isCancelled) return;

        const prevTables = tablesRef.current;
        const prevMap = new Map(prevTables.map((t) => [t.id, t]));

        // merge new data with existing running_total values,
        // BUT clear running_total if table is available or has no current_order_id
        let tablesWithTotals: (Table & { running_total?: number | null })[] =
          data.map((t) => {
            const prev = prevMap.get(t.id) as BillerTable | undefined;

            // if table is free, no amount should show
            if (t.status === "available" || !t.current_order_id) {
              return {
                ...t,
                running_total: null,
              };
            }

            return {
              ...t,
              running_total:
                (prev as any)?.running_total ??
                (t as any).running_total ??
                null,
            };
          });

        // Decide which occupied tables still need an initial running_total fetch
        const toFetch = tablesWithTotals.filter(
          (t) =>
            t.status !== "available" &&
            t.current_order_id &&
            !fetchedTotalsRef.current.has(t.id) &&
            (t.running_total === null || t.running_total === undefined)
        );

        if (toFetch.length > 0) {
          try {
            const orders = await Promise.all(
              toFetch.map((t) =>
                apiClient
                  .get<Order | null>(`/tables/${t.id}/current`)
                  .catch(() => null)
              )
            );

            const totalsByTableId = new Map<string, number>();
            orders.forEach((order, idx) => {
              if (order && order.totals) {
                totalsByTableId.set(
                  toFetch[idx].id,
                  order.totals.grand_total ?? 0
                );
              }
            });

            tablesWithTotals = tablesWithTotals.map((t) => {
              const total = totalsByTableId.get(t.id);
              if (typeof total === "number") {
                fetchedTotalsRef.current.add(t.id);
                return { ...t, running_total: total };
              }
              return t;
            });
          } catch {
            // ignore per-table errors
          }
        }

        if (!isCancelled) {
          setTables(tablesWithTotals as BillerTable[]);

          // If selected table disappeared, clear it
          if (
            selectedTable &&
            !tablesWithTotals.find((t) => t.id === selectedTable.id)
          ) {
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

    // Poll table list only every 2s
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
          order = await apiClient.post<Order>(
            `/tables/${selectedTable.id}/open`
          );
        } else {
          // Refresh current order snapshot
          order = await apiClient.get<Order | null>(
            `/tables/${selectedTable.id}/current`
          );
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
    }, 20000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedTable]);

  // Helper: refresh running total for selected table only
  const refreshSelectedTableTotal = async () => {
    if (!selectedTable) return;
    try {
      const order = await apiClient.get<Order | null>(
        `/tables/${selectedTable.id}/current`
      );
      if (!order) return;

      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTable.id
            ? ({
                ...t,
                running_total: order.totals.grand_total ?? 0,
              } as BillerTable)
            : t
        )
      );
      fetchedTotalsRef.current.add(selectedTable.id);
    } catch {
      // ignore, UI will still show last known total
    }
  };

  const updateOrderItem = async (item: OrderItem, qtyDelta: number) => {
    if (!currentOrder || itemUpdatingId) return;

    try {
      setItemUpdatingId(item.item_id);
      const updated = await apiClient.post<Order>(
        `/orders/${currentOrder.id}/items`,
        {
          item_id: item.item_id,
          qty_delta: qtyDelta,
        }
      );
      setCurrentOrder(updated);
      setStatusMessage("Updated item quantity");
      setStatusVariant("success");
      refreshSelectedTableTotal();
    } catch (error: any) {
      showToast(error.message || "Failed to update item", "error");
      setStatusMessage("Failed to update item");
      setStatusVariant("error");
    } finally {
      setItemUpdatingId(null);
    }
  };

  const handleKot = async () => {
    if (!currentOrder) return;
    try {
      setKotLoading(true);
      const updated = await apiClient.post<Order>(
        `/orders/${currentOrder.id}/kot`
      );
      setCurrentOrder(updated);
      // Clear running KOT snapshot since regular KOT becomes the new baseline
      clearRunningKotSnapshot(currentOrder.id);
      if (typeof window !== "undefined") {
        window.open(
          `/print/kot/${currentOrder.id}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
      setStatusMessage("KOT printed");
      setStatusVariant("success");
      refreshSelectedTableTotal();
    } catch (error: any) {
      showToast(error.message || "Failed to print KOT", "error");
      setStatusMessage("Failed to print KOT");
      setStatusVariant("error");
    } finally {
      setKotLoading(false);
    }
  };

  const handleRunningKot = () => {
    if (!currentOrder) return;
    if (typeof window !== "undefined") {
      window.open(
        `/print/kot-running/${currentOrder.id}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setStatusMessage("Running KOT printed");
    setStatusVariant("success");
  };

  const handleBill = async () => {
    if (!currentOrder) return;
    try {
      setBillLoading(true);
      const updated = await apiClient.post<Order>(
        `/orders/${currentOrder.id}/bill`
      );
      setCurrentOrder(updated);
      if (typeof window !== "undefined") {
        window.open(
          `/print/bill/${currentOrder.id}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
      setStatusMessage("Bill printed");
      setStatusVariant("success");
      refreshSelectedTableTotal();
    } catch (error: any) {
      showToast(error.message || "Failed to print bill", "error");
      setStatusMessage("Failed to print bill");
      setStatusVariant("error");
    } finally {
      setBillLoading(false);
    }
  };

  const handlePay = async () => {
    if (!currentOrder || currentOrder.totals.grand_total <= 0) return;
    try {
      setPaymentLoading(true);
      const updated = await apiClient.post<Order>(
        `/orders/${currentOrder.id}/payment`,
        [
          {
            amount: currentOrder.totals.grand_total,
            method: "cash",
            notes: "POS web full payment",
          },
        ]
      );
      setCurrentOrder(updated);
      setStatusMessage("Payment processed");
      setStatusVariant("success");

      // Clear running KOT snapshot for this settled order
      if (updated.status === "paid" || updated.status === "closed") {
        clearRunningKotSnapshot(updated.id);
      }

      // immediately clear total for this table in UI (in case backend marks it available)
      if (selectedTable) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === selectedTable.id
              ? ({ ...t, running_total: null } as BillerTable)
              : t
          )
        );
        fetchedTotalsRef.current.delete(selectedTable.id);
      }

      // still try to sync with backend (if it keeps order with 0 total, etc)
      refreshSelectedTableTotal();
    } catch (error: any) {
      showToast(error.message || "Failed to process payment", "error");
      setStatusMessage("Failed to process payment");
      setStatusVariant("error");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] w-full gap-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-4 lg:p-6">
      {/* Left: Areas + table grid */}
      <div className="flex min-w-[260px] flex-[3_1_0%] flex-col gap-4">
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
            <Badge
              variant="outline"
              className="border-slate-700 bg-slate-900/60 text-[11px]"
            >
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
        <div className="flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-3 lg:p-4">
          <TableGrid
            tables={tables}
            selectedTableId={selectedTable?.id ?? null}
            isLoading={tablesLoading}
            onSelectTable={(table) => setSelectedTable(table)}
            onOpenOrder={(table) =>
              router.push(
                `/biller/tables/${table.id}?name=${encodeURIComponent(
                  table.name
                )}`
              )
            }
          />
        </div>
      </div>

      {/* Right: Inline running order sidebar + payment */}
      <div className="hidden min-w-[260px] flex-[2_1_0%] flex-col gap-3 lg:flex">
        <RunningOrder
          tableName={selectedTable?.name ?? null}
          order={currentOrder}
          orderLoading={orderLoading}
          itemUpdatingId={itemUpdatingId}
          kotLoading={kotLoading}
          billLoading={billLoading}
          paymentLoading={paymentLoading}
          statusMessage={statusMessage}
          statusVariant={statusVariant}
          onChangeQty={updateOrderItem}
          onKot={handleKot}
          onRunningKot={handleRunningKot}
          onBill={handleBill}
          onPay={handlePay}
        />

        <PaymentBar
          order={currentOrder}
          onPaid={(updated) => {
            setCurrentOrder(updated);
            // Clear running KOT snapshot if order is settled
            if (updated.status === "paid" || updated.status === "closed") {
              clearRunningKotSnapshot(updated.id);
            }
            // we already clear + refresh inside handlePay when using that,
            // but if PaymentBar calls onPaid directly, we still want to sync
            refreshSelectedTableTotal();
            setSelectedTable(null);
          }}
          onStatus={(message, variant) => {
            setStatusMessage(message);
            setStatusVariant(variant);
          }}
        />
      </div>
    </div>
  );
}
