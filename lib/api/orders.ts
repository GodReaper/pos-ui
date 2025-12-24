import { apiClient } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";

// Scope controls which statuses backend returns:
// - "running"   => only running/open orders
// - "closed"    => only closed orders
// - "cancelled" => only cancelled orders
// - "all"       => running + closed + cancelled
export type OrderScope = "running" | "closed" | "cancelled" | "all";

export type OrderFilterTab = OrderScope;

export interface OrderListItem extends Order {
  table_name?: string;
  area_name?: string;
  biller_username?: string;
  status_label?: string;
  // Some list endpoints may return a flattened grand_total alongside or instead of totals.grand_total
  grand_total?: number | null;
}

export interface ListOrdersResponse {
  items: OrderListItem[];
  page: number;
  page_size: number;
  total: number;
}

export async function listOrders(params: {
  scope: OrderScope;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  billerId?: string;
}): Promise<ListOrdersResponse> {
  const { scope, page = 1, pageSize = 20, from, to, billerId } = params;

  return apiClient.get<ListOrdersResponse>("/orders", {
    params: {
      scope,
      page,
      page_size: pageSize,
      from,
      to,
      biller_id: billerId,
    },
  });
}

export async function cancelOrder(orderId: string, reason: string): Promise<Order> {
  return apiClient.post<Order>(`/orders/${orderId}/cancel`, {
    reason,
  });
}



