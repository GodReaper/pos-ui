"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import type { Order, Table, Area, OrderItem } from "@/lib/api/types";

/**
 * Storage key for last running KOT snapshot
 */
function getRunningKotStorageKey(orderId: string): string {
  return `running_kot_snapshot_${orderId}`;
}

/**
 * Gets the last running KOT snapshot from localStorage
 */
function getLastRunningKotSnapshot(orderId: string): OrderItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(getRunningKotStorageKey(orderId));
    if (stored) {
      return JSON.parse(stored) as OrderItem[];
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Saves the current items as the last running KOT snapshot
 */
function saveRunningKotSnapshot(orderId: string, items: OrderItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getRunningKotStorageKey(orderId), JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Gets recently added items by comparing current order items with the last printed snapshot.
 * Uses the last running KOT snapshot if available, otherwise falls back to last regular KOT print.
 */
function getRecentlyAddedItems(order: Order): OrderItem[] {
  if (!order || order.items.length === 0) {
    return [];
  }

  // Try to get last running KOT snapshot first
  const lastRunningKotItems = getLastRunningKotSnapshot(order.id);
  
  // If we have a saved running KOT snapshot, use that as baseline
  let baselineItems: OrderItem[] = [];
  if (lastRunningKotItems && lastRunningKotItems.length > 0) {
    baselineItems = lastRunningKotItems;
  } else if (order.kot_prints && order.kot_prints.length > 0) {
    // Otherwise, use last regular KOT print snapshot
    const lastKotPrint = order.kot_prints[order.kot_prints.length - 1];
    baselineItems = lastKotPrint.items_snapshot || [];
  } else {
    // No baseline - all current items are new
    return order.items;
  }

  // Create a map of item_id -> qty from the baseline
  const baselineQtyMap = new Map<string, number>();
  baselineItems.forEach((item) => {
    baselineQtyMap.set(item.item_id, (baselineQtyMap.get(item.item_id) || 0) + item.qty);
  });

  // Find items that are new or have increased quantities
  const recentItems: OrderItem[] = [];
  
  order.items.forEach((currentItem) => {
    const baselineQty = baselineQtyMap.get(currentItem.item_id) || 0;
    const currentQty = currentItem.qty;
    
    // If current quantity is greater than baseline quantity, this is a recent addition
    if (currentQty > baselineQty) {
      recentItems.push({
        ...currentItem,
        qty: currentQty - baselineQty, // Only include the difference
      });
    }
  });

  return recentItems;
}

export default function RunningKOTPrintPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [tableName, setTableName] = useState<string>("-");
  const [areaName, setAreaName] = useState<string>("-");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await apiClient.get<Order>(`/orders/${orderId}`);
        setOrder(data);

        // Fetch table name
        if (data.table_id && data.area_id) {
          try {
            const tables = await apiClient.get<Table[]>(`/areas/${data.area_id}/tables`);
            const table = tables.find((t) => t.id === data.table_id);
            if (table) {
              setTableName(table.name);
            }
          } catch {
            // Ignore table fetch errors
          }

          // Fetch area name
          try {
            const areas = await apiClient.get<Area[]>("/areas");
            const area = areas.find((a) => a.id === data.area_id);
            if (area) {
              setAreaName(area.name);
            }
          } catch {
            // Ignore area fetch errors
          }
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      void loadOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (!loading && order) {
      // Calculate recent items and save current items as new baseline
      const recentItems = getRecentlyAddedItems(order);
      // Save current items state as the new baseline for next running KOT
      saveRunningKotSnapshot(order.id, order.items);
      window.print();
    }
  }, [loading, order]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const dateStr = now.toLocaleDateString();

  const recentItems = order ? getRecentlyAddedItems(order) : [];

  return (
    <div className="print-root">
      <style>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box;
          }
          
          html, body {
            width: 100%;
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            overflow: visible !important;
          }
          
          body > *:not(.print-root) {
            display: none !important;
          }
          
          .print-root {
            width: 100%;
            height: auto;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          
          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
        
        @media screen {
          .print-root {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            background: #fff;
            color: #000;
            display: flex;
            justify-content: center;
            padding: 12px;
            min-height: 100vh;
          }
        }
        
        .ticket {
          width: 58mm;
          max-width: 58mm;
          font-size: 11px;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: 700;
        }
        .line {
          border-top: 1px dashed #000;
          margin: 4px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
        }
        .items {
          margin-top: 4px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .qty {
          width: 3ch;
        }
        .name {
          flex: 1;
          margin: 0 4px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      `}</style>

      <div className="ticket">
        <div className="center bold">RUNNING KOT</div>
        <div className="center">{dateStr} {timeStr}</div>
        <div className="line" />

        <div className="row">
          <span>Order</span>
          <span>#{orderId?.slice(-6)}</span>
        </div>
        <div className="row">
          <span>Table</span>
          <span>{tableName}</span>
        </div>
        <div className="row">
          <span>Area</span>
          <span>{areaName}</span>
        </div>

        <div className="line" />
        <div className="bold">QTY  ITEM</div>
        <div className="items">
          {loading && <div>Loading...</div>}
          {!loading && !order && <div>Order not found</div>}
          {!loading && order && recentItems.length === 0 && <div>No new items</div>}
          {!loading && order && recentItems.length > 0 && recentItems.map((item) => (
            <div key={item.item_id} className="item-row">
              <span className="qty">{item.qty}x</span>
              <span className="name">{item.name_snapshot}</span>
            </div>
          ))}
        </div>

        <div className="line" />
        <div className="center">-- END RUNNING KOT --</div>
      </div>
    </div>
  );
}

