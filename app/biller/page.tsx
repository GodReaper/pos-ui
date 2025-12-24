"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import type { Area, Table, Order, OrderItem } from "@/lib/api/types";
import { TableGrid } from "@/components/TableGrid";
import type { BillerTable } from "@/components/TableCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { RunningOrder } from "@/components/RunningOrder";
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
  const [statusVariant, setStatusVariant] = useState<"success" | "error" | "muted">(
    "muted"
  );

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
      setStatusMessage("Updated item quantity");
      setStatusVariant("success");
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
      const updated = await apiClient.post<Order>(`/orders/${currentOrder.id}/kot`);
      setCurrentOrder(updated);
      setStatusMessage("KOT printed");
      setStatusVariant("success");
    } catch (error: any) {
      showToast(error.message || "Failed to print KOT", "error");
      setStatusMessage("Failed to print KOT");
      setStatusVariant("error");
    } finally {
      setKotLoading(false);
    }
  };

  const handleBill = async () => {
    if (!currentOrder) return;
    try {
      setBillLoading(true);
      const updated = await apiClient.post<Order>(`/orders/${currentOrder.id}/bill`);
      setCurrentOrder(updated);
      setStatusMessage("Bill printed");
      setStatusVariant("success");
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
      const updated = await apiClient.post<Order>(`/orders/${currentOrder.id}/payment`, [
        {
          amount: currentOrder.totals.grand_total,
          method: "cash",
          notes: "POS web full payment",
        },
      ]);
      setCurrentOrder(updated);
      setStatusMessage("Payment processed");
      setStatusVariant("success");
    } catch (error: any) {
      showToast(error.message || "Failed to process payment", "error");
      setStatusMessage("Failed to process payment");
      setStatusVariant("error");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 lg:p-6">
      {/* Left: Areas + table grid */}
      <div className="flex min-w-[320px] max-w-md flex-col gap-4">
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
            onOpenOrder={(table) =>
              router.push(
                `/biller/tables/${table.id}?name=${encodeURIComponent(table.name)}`
              )
            }
          />
        </div>
      </div>

      {/* Right: Inline running order sidebar + payment */}
      <div className="hidden w-[380px] flex-col gap-3 lg:flex">
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
          onBill={handleBill}
          onPay={handlePay}
        />

        <PaymentBar
          order={currentOrder}
          onPaid={(updated) => {
            setCurrentOrder(updated);
            // Optionally clear selection after payment so table returns to idle
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
