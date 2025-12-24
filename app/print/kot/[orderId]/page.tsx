"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import type { Order, Table, Area } from "@/lib/api/types";

export default function KOTPrintPage() {
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
    if (!loading) {
      window.print();
    }
  }, [loading]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const dateStr = now.toLocaleDateString();

  return (
    <div className="print-root">
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
        .print-root {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: #fff;
          color: #000;
          display: flex;
          justify-content: center;
          padding: 12px;
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
        <div className="center bold">KITCHEN ORDER TICKET</div>
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
          {!loading && order && order.items.length === 0 && <div>No items</div>}
          {!loading && order && order.items.length > 0 && order.items.map((item) => (
            <div key={item.item_id} className="item-row">
              <span className="qty">{item.qty}x</span>
              <span className="name">{item.name_snapshot}</span>
            </div>
          ))}
        </div>

        <div className="line" />
        <div className="center">-- END KOT --</div>
      </div>
    </div>
  );
}


