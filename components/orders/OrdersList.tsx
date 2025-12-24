"use client";

import { useEffect, useState } from "react";
import type { OrderFilterTab, OrderListItem, OrderScope } from "@/lib/api/orders";
import { listOrders, cancelOrder } from "@/lib/api/orders";
import { OrderRow } from "./OrderRow";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

const TABS: { id: OrderFilterTab; label: string }[] = [
  { id: "running", label: "Running" },
  { id: "closed", label: "Closed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

interface OrdersListProps {
  // Whether current page is admin (affects cancel permissions only; backend enforces actual RBAC)
  isAdmin: boolean;
  billerIdFilter?: string; // used by admin
}

export function OrdersList({ isAdmin, billerIdFilter }: OrdersListProps) {
  const [tab, setTab] = useState<OrderFilterTab>("running");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const user = await apiClient.get<User>("/auth/me");
        if (!cancelled) setCurrentUser(user);
      } catch {
        if (!cancelled) setCurrentUser(null);
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const queryScope: OrderScope = tab;
        const res = await listOrders({
          scope: queryScope,
          page,
          pageSize,
          billerId: billerIdFilter,
        });
        if (isCancelled) return;
        setItems(res.items);
        setTotal(res.total);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load orders.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [tab, billerIdFilter, page, pageSize]);

  const handleCancel = async (orderId: string, reason: string) => {
    const updated = await cancelOrder(orderId, reason);
    setItems((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
    );
  };

  const canCancelOrder = (order: OrderListItem): boolean => {
    // Only block when already cancelled; backend allows cancelling any other status
    if (order.status === "cancelled") return false;
    if (isAdmin) return true;
    {
      if (!currentUser) return false;
      return order.created_by === currentUser.id;
    }
    return false;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-slate-800 bg-slate-900/80 p-1 text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                tab === t.id
                  ? "bg-sky-600 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400">
          Page {page} of {totalPages} · {total} orders
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-600/60 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      )}

      {loading && !items.length ? (
        <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
          Loading orders...
        </div>
      ) : !items.length ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/60 text-xs text-slate-500">
          No orders found for this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expandedId === order.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === order.id ? null : order.id))
              }
              canCancel={canCancelOrder(order)}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-300">
        <div>
          Showing{" "}
          <span className="font-semibold">
            {items.length ? 1 + (page - 1) * pageSize : 0}
          </span>{" "}
          -{" "}
          <span className="font-semibold">
            {(page - 1) * pageSize + items.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-[11px]"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-[11px]"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}



