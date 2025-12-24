"use client";

import { useEffect, useState } from "react";
import { OrdersList } from "@/components/orders/OrdersList";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { Label } from "@/components/ui/label";

export default function AdminOrdersPage() {
  const [billers, setBillers] = useState<User[]>([]);
  const [billerId, setBillerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadBillers() {
      try {
        const users = await apiClient.get<User[]>("/admin/users");
        setBillers(users.filter((u) => u.role === "biller"));
      } catch {
        // ignore filter errors; orders list will still work without biller filter
      }
    }
    loadBillers();
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor all orders across billers. Use filters to narrow down.
          </p>
        </div>

        <div className="flex flex-col gap-1 text-xs min-w-[220px]">
          <Label htmlFor="biller-filter">Filter by biller</Label>
          <select
            id="biller-filter"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            value={billerId ?? "all"}
            onChange={(e) => {
              const value = e.target.value;
              setBillerId(value === "all" ? undefined : value);
            }}
          >
            <option value="all">All billers</option>
            {billers.map((biller) => (
              <option key={biller.id} value={biller.id}>
                {biller.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2">
        <OrdersList isAdmin={true} billerIdFilter={billerId} />
      </div>
    </div>
  );
}



