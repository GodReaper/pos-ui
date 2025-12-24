"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { OrderPane } from "@/components/OrderPane";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function BillerTableOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tableId = params.tableId as string;
  const tableName = searchParams.get("name") || `Table`;

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (!tableId) return;

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadCurrentOrder = async (withOpen: boolean) => {
      try {
        setOrderLoading(true);

        let current: Order | null = null;

        if (withOpen) {
          current = await apiClient.post<Order>(`/tables/${tableId}/open`);
        } else {
          current = await apiClient.get<Order | null>(`/tables/${tableId}/current`);
        }

        if (!isCancelled) {
          setOrder(current);
        }
      } catch (error: unknown) {
        if (!isCancelled) {
          const message =
            typeof error === "object" && error && "message" in error
              ? String((error as { message: string }).message)
              : "Failed to load order";
          showToast(message, "error");
        }
      } finally {
        if (!isCancelled) {
          setOrderLoading(false);
        }
      }
    };

    // Initial open or resume
    loadCurrentOrder(true);

    // Poll current order every 2 seconds
    intervalId = setInterval(() => {
      loadCurrentOrder(false);
    }, 2000);

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [tableId]);

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 lg:p-6">
      {/* Top bar like native POS header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full border border-slate-800 bg-slate-900/80"
            onClick={() => router.push("/biller")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="text-sm font-semibold text-slate-50">{tableName}</div>
            <div className="text-[11px] text-slate-400">
              {order?.status ? `Status: ${order.status}` : "Tap items to add to order"}
            </div>
          </div>
        </div>
      </div>

      {/* Main three-column order pane */}
      <OrderPane
        table={{ id: tableId, name: tableName }}
        order={order}
        orderLoading={orderLoading}
        onOrderChange={setOrder}
        onKotSuccess={() => router.push("/biller")}
      />
    </div>
  );
}


