"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type { Category, MenuItem, Order, OrderItem } from "@/lib/api/types";
import { MenuCategories } from "@/components/MenuCategories";
import { MenuItems } from "@/components/MenuItems";
import { RunningOrder } from "@/components/RunningOrder";
import { showToast } from "@/lib/toast";

interface SimpleTable {
  id: string;
  name: string;
}

interface OrderPaneProps {
  table: SimpleTable | null;
  order: Order | null;
  orderLoading: boolean;
  onOrderChange: (order: Order | null) => void;
  onKotSuccess?: (order: Order) => void;
}

export function OrderPane({
  table,
  order,
  orderLoading,
  onOrderChange,
  onKotSuccess,
}: OrderPaneProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemUpdatingId, setItemUpdatingId] = useState<string | null>(null);
  const [kotLoading, setKotLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<"success" | "error" | "muted">(
    "muted"
  );

  // Load menu categories & items once from public /menu endpoint
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setCategoriesLoading(true);
        setItemsLoading(true);
        const data = await apiClient.get<any>("/menu", { requireAuth: false });

        // Backend returns: { categories: [ { ...category, items: [...] } ] }
        const rawCategories: any[] = Array.isArray(data?.categories)
          ? data.categories
          : [];

        const cats: Category[] = rawCategories
          .map((c: any) => ({
            id: String(c.id),
            name: String(c.name),
            sort_order: Number(c.sort_order ?? 0),
            created_at: String(c.created_at ?? ""),
          }))
          .sort((a, b) => a.sort_order - b.sort_order);

        const allItems: MenuItem[] = rawCategories.flatMap((c: any) =>
          Array.isArray(c.items)
            ? c.items
                .filter((item: any) => item.is_active !== false)
                .map((item: any) => ({
                  id: String(item.id),
                  category_id: String(item.category_id ?? c.id),
                  name: String(item.name),
                  price: Number(item.price ?? 0),
                  is_active: true,
                  created_at: String(item.created_at ?? ""),
                }))
            : []
        );

        setCategories(cats);
        setItems(allItems);
        if (!selectedCategoryId && cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
      } catch (error: any) {
        showToast(error.message || "Failed to load menu", "error");
      } finally {
        setCategoriesLoading(false);
        setItemsLoading(false);
      }
    };

    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems =
    selectedCategoryId === null
      ? items
      : items.filter((item) => item.category_id === selectedCategoryId);

  const handleAddItem = async (menuItem: MenuItem) => {
    if (!order) return;
    try {
      setItemUpdatingId(menuItem.id);
      const updated = await apiClient.post<Order>(`/orders/${order.id}/items`, {
        item_id: menuItem.id,
        qty_delta: 1,
      });
      onOrderChange(updated);
      setStatusMessage(`Added ${menuItem.name}`);
      setStatusVariant("success");
    } catch (error: any) {
      showToast(error.message || "Failed to add item", "error");
      setStatusMessage("Failed to add item");
      setStatusVariant("error");
    } finally {
      setItemUpdatingId(null);
    }
  };

  const handleChangeQty = async (item: OrderItem, delta: number) => {
    if (!order) return;
    try {
      setItemUpdatingId(item.item_id);
      const updated = await apiClient.post<Order>(`/orders/${order.id}/items`, {
        item_id: item.item_id,
        qty_delta: delta,
      });
      onOrderChange(updated);
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
    if (!order) return;
    try {
      setKotLoading(true);
      const updated = await apiClient.post<Order>(`/orders/${order.id}/kot`);
      onOrderChange(updated);
      onKotSuccess?.(updated);
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
    if (!order) return;
    try {
      setBillLoading(true);
      const updated = await apiClient.post<Order>(`/orders/${order.id}/bill`);
      onOrderChange(updated);
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
    if (!order || order.totals.grand_total <= 0) return;
    try {
      setPaymentLoading(true);
      const updated = await apiClient.post<Order>(`/orders/${order.id}/payment`, [
        {
          amount: order.totals.grand_total,
          method: "cash",
          notes: "POS web full payment",
        },
      ]);
      onOrderChange(updated);
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
    <div className="flex h-full min-h-[420px] flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-100">
            {table ? table.name : "No table selected"}
          </div>
          <div className="text-[11px] text-slate-400">
            {table
              ? order
                ? `Order #${order.id.slice(-6)} · ${order.status}`
                : orderLoading
                  ? "Loading order…"
                  : "No active order yet."
              : "Select a table to start an order."}
          </div>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
        <MenuCategories
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          loading={categoriesLoading}
        />
        <MenuItems
          items={filteredItems}
          loading={itemsLoading}
          onAddItem={handleAddItem}
          searchTerm={itemSearch}
          onSearchTermChange={setItemSearch}
        />
        <RunningOrder
          tableName={table?.name ?? null}
          order={order}
          orderLoading={orderLoading}
          itemUpdatingId={itemUpdatingId}
          kotLoading={kotLoading}
          billLoading={billLoading}
          paymentLoading={paymentLoading}
          statusMessage={statusMessage}
          statusVariant={statusVariant}
          onChangeQty={handleChangeQty}
          onKot={handleKot}
          onBill={handleBill}
          onPay={handlePay}
        />
      </div>
    </div>
  );
}


