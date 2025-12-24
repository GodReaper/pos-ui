"use client";

import { OrdersList } from "@/components/orders/OrdersList";

export default function BillerOrdersPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">Orders</h1>
        <p className="mt-1 text-xs text-slate-400">
          View and manage your running and past orders. Tap a row to see full details.
        </p>
      </div>

      <OrdersList isAdmin={false} />
    </div>
  );
}



